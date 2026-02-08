import { Router } from "express";
import { body, validationResult } from "express-validator";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { suggestCategory } from "../services/smartCategories.js";
import { Decimal } from "@prisma/client/runtime/library";

export const expensesRouter = Router();
expensesRouter.use(authMiddleware);
expensesRouter.use(requireUser);

function toDecimal(n: number | string): Decimal {
  return new Decimal(Number(n));
}

expensesRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const groupId = req.query.groupId as string | undefined;
    const expenses = await prisma.expense.findMany({
      where: {
        ...(groupId ? { groupId } : {}),
        OR: [
          { participants: { some: { userId } } },
          { groupId: groupId ? undefined : { not: null }, group: { members: { some: { userId } } } },
        ],
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        payers: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        splits: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        participants: { include: { user: { select: { id: true, name: true } } } },
        group: groupId ? undefined : { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(expenses);
  } catch (e) {
    next(e);
  }
});

expensesRouter.post(
  "/",
  body("groupId").optional().isString(),
  body("title").trim().notEmpty(),
  body("description").optional().trim(),
  body("category").optional().trim(),
  body("totalAmount").isNumeric(),
  body("currency").optional().trim(),
  body("imageUrl").optional().trim(),
  body("splitType").isIn(["EQUAL", "EXACT", "PERCENTAGE", "SHARE"]),
  body("participantIds").isArray(),
  body("participantIds.*").isString(),
  body("payers").isArray(), // [{ userId, amountPaid }]
  body("payers.*.userId").isString(),
  body("payers.*.amountPaid").isNumeric(),
  body("splits").optional().isArray(), // for EXACT: [{ userId, amountOwed }], PERCENTAGE: [{ userId, percentage }], SHARE: [{ userId, shares }]
  async (req: AuthRequest, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
      const {
        groupId,
        title,
        description,
        category,
        totalAmount,
        currency = "INR",
        imageUrl,
        splitType,
        participantIds,
        payers,
        splits,
      } = req.body;

      const totalPaid = (payers as { amountPaid: number }[]).reduce((s, p) => s + Number(p.amountPaid), 0);
      if (Math.abs(totalPaid - Number(totalAmount)) > 0.02) {
        throw new AppError(400, "Sum of payers must equal total amount", "VALIDATION_ERROR");
      }

      const participants = Array.from(new Set(participantIds as string[]));
      if (!participants.includes(userId)) participants.push(userId);

      let categoryFinal = (category as string)?.trim() || suggestCategory(title, description);

      const expense = await prisma.$transaction(async (tx) => {
        const exp = await tx.expense.create({
          data: {
            groupId: groupId || null,
            title,
            description: description || null,
            category: categoryFinal,
            totalAmount: toDecimal(totalAmount),
            currency,
            imageUrl: imageUrl || null,
            splitType,
            createdById: userId,
            expenseDate: new Date(),
          },
        });

        await tx.expenseParticipant.createMany({
          data: participants.map((uid: string) => ({ expenseId: exp.id, userId: uid })),
        });

        await tx.expensePayer.createMany({
          data: (payers as { userId: string; amountPaid: number }[]).map((p) => ({
            expenseId: exp.id,
            userId: p.userId,
            amountPaid: toDecimal(p.amountPaid),
          })),
        });

        const splitData: { expenseId: string; userId: string; amountOwed: Decimal; percentage?: Decimal; shares?: number }[] = [];
        const total = Number(totalAmount);

        if (splitType === "EQUAL") {
          const each = total / participants.length;
          for (const uid of participants) {
            splitData.push({ expenseId: exp.id, userId: uid, amountOwed: toDecimal(each) });
          }
        } else if (splitType === "EXACT" && Array.isArray(splits)) {
          for (const s of splits as { userId: string; amountOwed: number }[]) {
            splitData.push({ expenseId: exp.id, userId: s.userId, amountOwed: toDecimal(s.amountOwed) });
          }
        } else if (splitType === "PERCENTAGE" && Array.isArray(splits)) {
          for (const s of splits as { userId: string; percentage: number }[]) {
            const amt = (total * Number(s.percentage)) / 100;
            splitData.push({
              expenseId: exp.id,
              userId: s.userId,
              amountOwed: toDecimal(amt),
              percentage: toDecimal(s.percentage),
            });
          }
        } else if (splitType === "SHARE" && Array.isArray(splits)) {
          const totalShares = (splits as { shares: number }[]).reduce((sum, s) => sum + Number(s.shares || 0), 0);
          if (totalShares <= 0) throw new AppError(400, "Total shares must be positive", "VALIDATION_ERROR");
          for (const s of splits as { userId: string; shares: number }[]) {
            const amt = (total * Number(s.shares)) / totalShares;
            splitData.push({
              expenseId: exp.id,
              userId: s.userId,
              amountOwed: toDecimal(amt),
              shares: Number(s.shares),
            });
          }
        } else {
          throw new AppError(400, "Invalid splits for split type", "VALIDATION_ERROR");
        }

        await tx.expenseSplit.createMany({ data: splitData });
        return exp;
      });

      const created = await prisma.expense.findUnique({
        where: { id: expense.id },
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          payers: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
          splits: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
          participants: { include: { user: { select: { id: true, name: true } } } },
          group: { select: { id: true, name: true } },
        },
      });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  }
);

expensesRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const expense = await prisma.expense.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { participants: { some: { userId } } },
          { group: { members: { some: { userId } } } },
        ],
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        payers: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        splits: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        participants: { include: { user: { select: { id: true, name: true } } } },
        group: { select: { id: true, name: true } },
      },
    });
    if (!expense) throw new AppError(404, "Expense not found", "NOT_FOUND");
    res.json(expense);
  } catch (e) {
    next(e);
  }
});

// Update expense (title, category only for simplicity)
expensesRouter.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: { group: { include: { members: true } } },
    });
    if (!expense) throw new AppError(404, "Expense not found", "NOT_FOUND");
    
    const isCreator = expense.createdById === userId;
    const isAdmin = expense.group?.members.some((m: any) => m.userId === userId && m.role === "ADMIN");
    
    if (!isCreator && !isAdmin) {
      throw new AppError(403, "Not authorized to update expense", "FORBIDDEN");
    }
    
    const { title, category, description } = req.body;
    const updated = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(category ? { category: category.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        payers: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        splits: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        participants: { include: { user: { select: { id: true, name: true } } } },
        group: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

expensesRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: { group: { include: { members: true } } },
    });
    if (!expense) throw new AppError(404, "Expense not found", "NOT_FOUND");
    
    // Auth: Creator or Group Admin
    const isCreator = expense.createdById === userId;
    const isAdmin = expense.group?.members.some((m: any) => m.userId === userId && m.role === "ADMIN");
    
    if (!isCreator && !isAdmin) {
      throw new AppError(403, "Not authorized to delete expense", "FORBIDDEN");
    }
    
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// Category suggestions
expensesRouter.post("/suggest-category", body("title").trim(), body("description").optional().trim(), (req, res) => {
  const category = suggestCategory(req.body.title ?? "", req.body.description);
  res.json({ category });
});
