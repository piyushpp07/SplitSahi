import { Router } from "express";
import { body, validationResult } from "express-validator";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export const groupsRouter = Router();
groupsRouter.use(authMiddleware);
groupsRouter.use(requireUser);

groupsRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(groups);
  } catch (e) {
    next(e);
  }
});

groupsRouter.post(
  "/",
  body("name").trim().notEmpty(),
  body("description").optional().trim(),
  body("emoji").optional().trim(),
  body("memberIds").optional().isArray(),
  body("memberIds.*").optional().isString(),
  async (req: AuthRequest, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
      const { name, description, emoji, memberIds } = req.body;
      const group = await prisma.group.create({
        data: {
          name,
          description,
          emoji,
          createdById: userId,
          members: {
            create: [
              { userId, role: "ADMIN" },
              ...(Array.isArray(memberIds) ? memberIds.filter((id: string) => id !== userId).map((id: string) => ({ userId: id, role: "MEMBER" as const })) : []),
            ],
          },
        },
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        },
      });
      res.status(201).json(group);
    } catch (e) {
      next(e);
    }
  }
);

groupsRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const group = await prisma.group.findFirst({
      where: { id: req.params.id, members: { some: { userId } } },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } } },
      },
    });
    if (!group) throw new AppError(404, "Group not found", "NOT_FOUND");
    res.json(group);
  } catch (e) {
    next(e);
  }
});

groupsRouter.patch(
  "/:id",
  body("name").optional().trim().notEmpty(),
  body("description").optional().trim(),
  body("emoji").optional().trim(),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
      const member = await prisma.groupMember.findFirst({
        where: { groupId: req.params.id, userId, role: "ADMIN" },
      });
      if (!member) throw new AppError(403, "Only admins can update group", "FORBIDDEN");
      const { name, description, emoji } = req.body;
      const group = await prisma.group.update({
        where: { id: req.params.id },
        data: { name, description, emoji },
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        },
      });
      res.json(group);
    } catch (e) {
      next(e);
    }
  }
);

groupsRouter.post("/:id/members", body("userId").isString(), async (req: AuthRequest, res, next) => {
  try {
    const currentUserId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const admin = await prisma.groupMember.findFirst({
      where: { groupId: req.params.id, userId: currentUserId, role: "ADMIN" },
    });
    if (!admin) throw new AppError(403, "Only admins can add members", "FORBIDDEN");
    const { userId } = req.body;
    await prisma.groupMember.create({
      data: { groupId: req.params.id, userId, role: "MEMBER" },
    });
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      },
    });
    res.status(201).json(group);
  } catch (e) {
    next(e);
  }
});

groupsRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const member = await prisma.groupMember.findFirst({
      where: { groupId: req.params.id, userId, role: "ADMIN" },
    });
    if (!member) throw new AppError(403, "Only admins can delete group", "FORBIDDEN");
    await prisma.group.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

groupsRouter.delete("/:id/members/:userId", async (req: AuthRequest, res, next) => {
  try {
    const currentUserId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const admin = await prisma.groupMember.findFirst({
      where: { groupId: req.params.id, userId: currentUserId, role: "ADMIN" },
    });
    if (!admin && currentUserId !== req.params.userId) {
      throw new AppError(403, "Not authorized", "FORBIDDEN");
    }
    await prisma.groupMember.deleteMany({
      where: { groupId: req.params.id, userId: req.params.userId },
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// Join group by invite code or group ID
groupsRouter.post(
  "/join",
  body("groupId").trim().notEmpty().withMessage("Group ID or invite code is required"),
  async (req: AuthRequest, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");

      const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
      const { groupId } = req.body;

      // Check if group exists
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      });

      if (!group) {
        throw new AppError(404, "Group not found. Please check the invite code.", "NOT_FOUND");
      }

      // Check if user is already a member
      const existingMember = group.members.find(m => m.userId === userId);
      if (existingMember) {
        return res.json({
          message: "You are already a member of this group",
          group,
        });
      }

      // Add user as member
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId,
          role: "MEMBER",
        },
      });

      // Fetch updated group
      const updatedGroup = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          members: { include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } } },
        },
      });

      res.json({
        message: `Successfully joined "${group.name}"!`,
        group: updatedGroup,
      });
    } catch (e) {
      next(e);
    }
  }
);
