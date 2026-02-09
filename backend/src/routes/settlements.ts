import { Router } from "express";
import { body, validationResult } from "express-validator";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export const settlementsRouter = Router();
settlementsRouter.use(authMiddleware);
settlementsRouter.use(requireUser);

// Create a settlement
settlementsRouter.post(
  "/",
  body("toUserId").isString(),
  body("amount").isNumeric(),
  body("groupId").optional().isString(),
  body("paymentMethod").optional().isIn(["UPI", "CASH", "OTHER"]),
  body("notes").optional().isString(),
  async (req: AuthRequest, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      
      const currentUserId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
      let { toUserId, fromUserId, amount, groupId, paymentMethod = "CASH", notes } = req.body;

      if (!fromUserId) fromUserId = currentUserId;

      // Validation: Current user must be involved
      if (fromUserId !== currentUserId && toUserId !== currentUserId) {
        throw new AppError(403, "You can only record settlements you are part of", "FORBIDDEN");
      }

      if (fromUserId === toUserId) {
        throw new AppError(400, "Cannot settle with yourself", "INVALID_DATA");
      }

      const settlement = await prisma.settlement.create({
        data: {
          fromUserId,
          toUserId,
          amount,
          groupId: groupId || null,
          paymentMethod,
          notes,
          status: "COMPLETED", // Assuming recorded settlements are completed for now
          completedAt: new Date(),
        },
        include: {
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
      });

      res.status(201).json(settlement);
    } catch (e) {
      next(e);
    }
  }
);

// Get balances with friends
settlementsRouter.get("/balances", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    
    // 1. Get all expenses where I am a payer or participant
    const expenses = await prisma.expense.findMany({
      where: {
        OR: [
          { payers: { some: { userId } } },
          { splits: { some: { userId } } }
        ]
      },
      include: {
        payers: true,
        splits: true
      }
    });

    // 2. Get all settlements
    const settlements = await prisma.settlement.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      }
    });

    const balances: Record<string, number> = {};

    // Calculate from expenses
    for (const exp of expenses) {
      // Amount I paid
      const myPaid = exp.payers.find(p => p.userId === userId)?.amountPaid || 0;
      // Amount I owe
      const myOwe = exp.splits.find(s => s.userId === userId)?.amountOwed || 0;
      
      // For each other person in this expense, their share vs what they paid
      // This is complex for multi-payer. Simpler: map net balances per expense.
      // Net balance for Me = (Total I Paid) - (Total I Owe).
      // But we need per-person.
      
      // Simple logic: If I paid for someone, they owe me. If they paid for me, I owe them.
      // In a 2-person expense: Me paid 100, split 50/50. Friend owes me 50.
    }

    // Actually, a simpler way to calculate balances is needed.
    // Let's use a simpler approach for now: Get total owed to me and total I owe.
    
    res.json({ message: "Balances calculation in progress" });
  } catch (e) {
    next(e);
  }
});
