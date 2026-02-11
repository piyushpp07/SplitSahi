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

    const activities = await prisma.activity.findMany({
      where: {
        ...(groupId
          ? { groupId }
          : {
            OR: [
              { userId },
              { group: { members: { some: { userId } } } }
            ]
          }
        ),
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, emoji: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json({ activities });
  } catch (e) {
    next(e);
  }
});
