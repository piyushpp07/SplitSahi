import { Router } from "express";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { Decimal } from "@prisma/client/runtime/library";

export const friendBalanceRouter = Router();
friendBalanceRouter.use(authMiddleware);
friendBalanceRouter.use(requireUser);

function toNum(d: Decimal | number): number {
  if (typeof d === "number") return d;
  return Number(d);
}

// Get balance and transactions with a specific friend
friendBalanceRouter.get("/:friendId", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const friendId = req.params.friendId;

    // Get friend info
    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, name: true, email: true, avatarUrl: true, upiId: true },
    });

    if (!friend) {
      return res.status(404).json({ error: "Friend not found" });
    }

    // Get all expenses where both users are participants
    const expenses = await prisma.expense.findMany({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: friendId } } },
        ],
      },
      include: {
        creator: { select: { id: true, name: true } },
        payers: { include: { user: { select: { id: true, name: true } } } },
        splits: { include: { user: { select: { id: true, name: true } } } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Get settlements between user and friend
    const settlements = await prisma.settlement.findMany({
      where: {
        status: "COMPLETED",
        OR: [
          { fromUserId: userId, toUserId: friendId },
          { fromUserId: friendId, toUserId: userId },
        ],
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Calculate balance between user and friend
    // Positive = friend owes me, Negative = I owe friend
    let balance = 0;

    for (const exp of expenses) {
      // What each user paid
      const myPaid = exp.payers.find(p => p.userId === userId)?.amountPaid || 0;
      const friendPaid = exp.payers.find(p => p.userId === friendId)?.amountPaid || 0;
      
      // What each user owes
      const myOwed = exp.splits.find(s => s.userId === userId)?.amountOwed || 0;
      const friendOwed = exp.splits.find(s => s.userId === friendId)?.amountOwed || 0;
      
      // If I paid and friend owes, friend owes me (myPaid covers friend's share)
      // Net contribution = what I paid - what I owe
      // If I paid more than I owe → I covered others → they owe me
      const myNet = toNum(myPaid) - toNum(myOwed);
      const friendNet = toNum(friendPaid) - toNum(friendOwed);
      
      // If I have positive net and friend has negative, friend owes me their negative portion
      // Simpler: calculate what friend owes me from my payments
      // When I pay 100 and we split 50/50, friend owes me 50
      if (toNum(myPaid) > 0 && toNum(friendOwed) > 0) {
        // I paid something, friend owes something from this expense
        // Friend owes me their share (proportional to what I paid vs total paid)
        const totalPaid = exp.payers.reduce((s, p) => s + toNum(p.amountPaid), 0);
        const myPayRatio = toNum(myPaid) / totalPaid;
        balance += toNum(friendOwed) * myPayRatio;
      }
      if (toNum(friendPaid) > 0 && toNum(myOwed) > 0) {
        // Friend paid, I owe
        const totalPaid = exp.payers.reduce((s, p) => s + toNum(p.amountPaid), 0);
        const friendPayRatio = toNum(friendPaid) / totalPaid;
        balance -= toNum(myOwed) * friendPayRatio;
      }
    }

    // Apply settlements
    for (const s of settlements) {
      if (s.fromUserId === userId) {
        // I paid friend → reduces what I owe (or increases what they owe)
        balance += toNum(s.amount);
      } else {
        // Friend paid me → reduces what they owe (or increases what I owe)
        balance -= toNum(s.amount);
      }
    }

    // Combine and sort by date
    const transactions = [
      ...expenses.map(e => ({
        type: "expense" as const,
        id: e.id,
        createdAt: e.createdAt,
        title: e.title,
        amount: toNum(e.totalAmount),
        category: e.category,
        paidBy: e.payers.map(p => ({ name: p.user.name, amount: toNum(p.amountPaid) })),
        myShare: toNum(e.splits.find(s => s.userId === userId)?.amountOwed || 0),
        friendShare: toNum(e.splits.find(s => s.userId === friendId)?.amountOwed || 0),
        group: e.group,
      })),
      ...settlements.map(s => ({
        type: "settlement" as const,
        id: s.id,
        createdAt: s.createdAt,
        amount: toNum(s.amount),
        fromUser: s.fromUser,
        toUser: s.toUser,
        isFromMe: s.fromUserId === userId,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      friend,
      balance: Math.round(balance * 100) / 100, // Positive = friend owes me
      transactions,
    });
  } catch (e) {
    next(e);
  }
});

export default friendBalanceRouter;
