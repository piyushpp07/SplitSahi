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
    const { youOwe, youAreOwed, simplifiedTransactions } = await getDashboardTotals(userId, groupId);

    // Enrich transactions with user names
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
    const transactionsWithUsers = simplifiedTransactions.map((t) => ({
      ...t,
      fromUser: userMap.get(t.fromUserId),
      toUser: userMap.get(t.toUserId),
    }));

    res.json({
      youOwe,
      youAreOwed,
      simplifiedTransactions: transactionsWithUsers,
    });
  } catch (e) {
    next(e);
  }
});
