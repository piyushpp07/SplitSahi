import { Router } from "express";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const activityRouter = Router();
activityRouter.use(authMiddleware);
activityRouter.use(requireUser);

// Activity feed: expenses (who added what) and settlements, ordered by time
activityRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const groupId = req.query.groupId as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const expenses = await prisma.expense.findMany({
      where: {
        ...(groupId ? { groupId } : {}),
        OR: [
          { participants: { some: { userId } } },
          { group: { members: { some: { userId } } } },
        ],
      },
      select: {
        id: true,
        title: true,
        totalAmount: true,
        currency: true,
        category: true,
        createdAt: true,
        createdById: true,
        groupId: true,
        group: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const settlements = groupId
      ? await prisma.settlement.findMany({
          where: { groupId, OR: [{ fromUserId: userId }, { toUserId: userId }] },
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
            fromUserId: true,
            toUserId: true,
            fromUser: { select: { id: true, name: true, avatarUrl: true } },
            toUser: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        })
      : await prisma.settlement.findMany({
          where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
            fromUserId: true,
            toUserId: true,
            fromUser: { select: { id: true, name: true, avatarUrl: true } },
            toUser: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        });

    type ActivityItem =
      | { type: "expense"; id: string; createdAt: Date; data: (typeof expenses)[0] }
      | { type: "settlement"; id: string; createdAt: Date; data: (typeof settlements)[0] };

    const activities: ActivityItem[] = [
      ...expenses.map((e) => ({ type: "expense" as const, id: e.id, createdAt: e.createdAt, data: e })),
      ...settlements.map((s) => ({ type: "settlement" as const, id: s.id, createdAt: s.createdAt, data: s })),
    ];
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const sliced = activities.slice(0, limit);

    res.json({ activities: sliced });
  } catch (e) {
    next(e);
  }
});
