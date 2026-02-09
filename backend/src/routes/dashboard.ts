import { Router } from "express";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { getDashboardTotals } from "../services/balance.js";
import { prisma } from "../lib/prisma.js";

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);
dashboardRouter.use(requireUser);

dashboardRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const groupId = (req.query.groupId as string) || null;

    // getDashboardTotals already returns simplified transactions filtered for this user
    const { youOwe, youAreOwed, simplifiedTransactions } = await getDashboardTotals(userId, groupId);

    // Enrich transactions with user details
    const userIds = new Set<string>();
    for (const t of simplifiedTransactions) {
      userIds.add(t.fromUserId);
      userIds.add(t.toUserId);
    }

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true, avatarUrl: true, upiId: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedTransactions = simplifiedTransactions.map((t) => {
      const fromUser = userMap.get(t.fromUserId);
      const toUser = userMap.get(t.toUserId);

      // Robust logging to catch why "Vinay" might be appearing twice
      if (t.fromUserId !== userId && t.toUserId !== userId) {
        console.warn(`[Dashboard] PRIVACY LEAK? Transaction found not involving user ${userId}: ${t.fromUserId} owes ${t.toUserId}`);
      }

      return {
        ...t,
        fromUser: fromUser || { id: t.fromUserId, name: "Unknown User" },
        toUser: toUser || { id: t.toUserId, name: "Unknown User" },
      };
    });

    res.json({
      youOwe,
      youAreOwed,
      simplifiedTransactions: enrichedTransactions,
    });
  } catch (e) {
    next(e);
  }
});
