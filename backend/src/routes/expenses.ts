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
  const num = Number(n);
  if (!isFinite(num)) return new Decimal(0);
  return new Decimal(num.toFixed(2));
}

expensesRouter.get("/export", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const expenses = await prisma.expense.findMany({
      where: {
        OR: [
          { participants: { some: { userId } } },
          { group: { members: { some: { userId } } } },
        ],
      },
      include: {
        creator: { select: { name: true } },
        group: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    let csv = "Date,Title,Amount,Category,Created By,Group\n";
    for (const e of expenses) {
      const date = e.createdAt.toLocaleDateString();
      const title = e.title.replace(/,/g, "");
      const amount = e.totalAmount.toString();
      const cat = e.category || "Other";
      const creator = e.creator.name;
      const group = e.group?.name || "Personal";
      csv += `${date},${title},${amount},${cat},${creator},${group}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=expenses.csv");
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

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
  body("groupId").optional().isString().withMessage("Invalid group selection"),
  body("title").trim().notEmpty().withMessage("Expense title is required"),
  body("description").optional().trim(),
  body("category").optional().trim(),
  body("emoji").optional().trim(),
  body("totalAmount").isFloat({ min: 0.1 }).withMessage("Total amount must be a positive number"),
  body("currency").optional().trim(),
  body("imageUrl").optional().trim(),
  body("splitType").isIn(["EQUAL", "EXACT", "PERCENTAGE", "SHARE"]).withMessage("Invalid split type"),
  body("participantIds").isArray({ min: 1 }).withMessage("At least one participant is required"),
  body("participantIds.*").isString().withMessage("Invalid participant ID"),
  body("payers").isArray({ min: 1 }).withMessage("At least one payer is required"),
  body("payers.*.userId").isString().withMessage("Invalid payer user ID"),
  body("payers.*.amountPaid").isFloat({ min: 0 }).withMessage("Payer amount must be a non-negative number"),
  body("splits").optional().isArray().withMessage("Splits must be an array"),
  body("frequency").optional().isIn(["DAILY", "WEEKLY", "MONTHLY"]).withMessage("Invalid frequency selection"),
  async (req: AuthRequest, res, next) => {
    try {
      console.log("POST /expenses payload:", JSON.stringify(req.body, null, 2));
      const err = validationResult(req);
      if (!err.isEmpty()) {
        const msg = err.array().map(e => `${(e as any).path || (e as any).param}: ${e.msg}`).join(", ");
        throw new AppError(400, msg, "VALIDATION_ERROR");
      }
      const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
      const {
        groupId,
        title,
        description,
        category,
        emoji,
        totalAmount,
        currency = "INR",
        imageUrl,
        splitType,
        participantIds,
        payers,
        splits,
        frequency,
        date,
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
            emoji: emoji || null,
            totalAmount: toDecimal(totalAmount),
            currency,
            imageUrl: imageUrl || null,
            splitType,
            createdById: userId,
            expenseDate: date ? new Date(date) : new Date(),
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

        // Create Recurring Expense if frequency is set
        if (frequency) {
          let nextDate = new Date();
          if (frequency === "DAILY") nextDate.setDate(nextDate.getDate() + 1);
          if (frequency === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7);
          if (frequency === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1);

          await tx.recurringExpense.create({
            data: {
              title,
              description: description || null,
              amount: toDecimal(totalAmount),
              category: categoryFinal,
              frequency,
              nextRunDate: nextDate,
              groupId: groupId || null,
              createdById: userId,
              splitType,
              participants: participants, // [string]
              splits: splits || [], // Json array
            },
          });
        }

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
        ...(req.body.emoji !== undefined ? { emoji: req.body.emoji?.trim() || null } : {}),
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
