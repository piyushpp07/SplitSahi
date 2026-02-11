import { Router } from "express";
import { body, validationResult } from "express-validator";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export const friendshipsRouter = Router();
friendshipsRouter.use(authMiddleware);
friendshipsRouter.use(requireUser);

// Get all friends
friendshipsRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const friends = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { receiverId: userId }],
        status: "ACCEPTED",
      },
      include: {
        requester: { select: { id: true, name: true, email: true, avatarUrl: true, upiId: true, emoji: true } as any },
        receiver: { select: { id: true, name: true, email: true, avatarUrl: true, upiId: true, emoji: true } as any },
      },
    });

    const simpleFriends = friends.map((f) =>
      f.requesterId === userId ? f.receiver : f.requester
    );

    res.json(simpleFriends);
  } catch (e) {
    next(e);
  }
});

// Add friend (Request)
friendshipsRouter.post(
  "/",
  body("friendId").isString(),
  async (req: AuthRequest, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");

      const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
      const { friendId } = req.body;

      if (userId === friendId) throw new AppError(400, "Cannot add yourself", "BAD_REQUEST");

      // For simplicity, auto-accept friendship in this version
      const friendship = await prisma.friendship.upsert({
        where: {
          requesterId_receiverId: {
            requesterId: userId < friendId ? userId : friendId,
            receiverId: userId < friendId ? friendId : userId,
          },
        },
        update: { status: "ACCEPTED" },
        create: {
          requesterId: userId < friendId ? userId : friendId,
          receiverId: userId < friendId ? friendId : userId,
          status: "ACCEPTED",
        },
      });

      res.status(201).json(friendship);
    } catch (e) {
      next(e);
    }
  }
);

// Remove friend
friendshipsRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const friendId = req.params.id;

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: userId, receiverId: friendId },
          { requesterId: friendId, receiverId: userId },
        ],
      },
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
