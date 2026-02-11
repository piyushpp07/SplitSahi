import { Router } from "express";
import { body, validationResult } from "express-validator";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { suggestCategory } from "../services/smartCategories.js";
import { ExpenseService } from "../services/expense.js";

export const expensesRouter = Router();
expensesRouter.use(authMiddleware);
expensesRouter.use(requireUser);

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
    const expenses = await ExpenseService.getExpenses(userId, groupId);
    res.json(expenses);
  } catch (e) {
    next(e);
  }
});

expensesRouter.post(
  "/",
  body("title").trim().notEmpty(),
  body("totalAmount").isFloat({ min: 0.1 }),
  body("splitType").isIn(["EQUAL", "EXACT", "PERCENTAGE", "SHARE"]),
  body("participantIds").isArray({ min: 1 }),
  body("payers").isArray({ min: 1 }),
  async (req: AuthRequest, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, "Validation failed", "VALIDATION_ERROR");
      const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
      const expense = await ExpenseService.createExpense(userId, req.body);
      res.status(201).json(expense);
    } catch (e) {
      next(e);
    }
  }
);

expensesRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const expense = await ExpenseService.getExpenseById(req.params.id, userId);
    res.json(expense);
  } catch (e) {
    next(e);
  }
});

expensesRouter.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const { title, category, description, emoji } = req.body;
    const updated = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(category ? { category: category.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(emoji !== undefined ? { emoji: emoji?.trim() || null } : {}),
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
    await ExpenseService.deleteExpense(req.params.id, userId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

expensesRouter.post("/suggest-category", body("title").trim(), (req, res) => {
  const category = suggestCategory(req.body.title ?? "", req.body.description);
  res.json({ category });
});
