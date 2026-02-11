import { Router } from "express";
import { body, validationResult } from "express-validator";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export const groupsRouter = Router();
groupsRouter.use(authMiddleware);
groupsRouter.use(requireUser);

import { GroupService } from "../services/group.js";
import { getSimplifiedDebts } from "../services/debtSimplification.js";

groupsRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const groups = await GroupService.getUserGroups(userId);
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
  async (req: AuthRequest, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
      const group = await GroupService.createGroup(userId, req.body);
      res.status(201).json(group);
    } catch (e) {
      next(e);
    }
  }
);

groupsRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const group = await GroupService.getGroupById(req.params.id, userId);
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
      const group = await GroupService.updateGroup(req.params.id, userId, req.body);
      res.json(group);
    } catch (e) {
      next(e);
    }
  }
);

groupsRouter.post("/:id/members", body("userId").isString(), async (req: AuthRequest, res, next) => {
  try {
    const currentUserId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const group = await GroupService.addMember(req.params.id, currentUserId, req.body.userId);
    res.status(201).json(group);
  } catch (e) {
    next(e);
  }
});

groupsRouter.delete("/:id/members/:userId", async (req: AuthRequest, res, next) => {
  try {
    const currentUserId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    await GroupService.removeMember(req.params.id, currentUserId, req.params.userId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

groupsRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    await GroupService.deleteGroup(req.params.id, userId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

groupsRouter.get("/:id/simplified-debts", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    // Verify membership first
    await GroupService.getGroupById(req.params.id, userId);

    const debts = await getSimplifiedDebts(req.params.id);
    const userIds = new Set<string>();
    debts.forEach(d => { userIds.add(d.from); userIds.add(d.to); });

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true, avatarUrl: true, upiId: true, emoji: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    const enrichedDebts = debts.map(d => ({
      from: userMap.get(d.from),
      to: userMap.get(d.to),
      amount: d.amount
    }));

    res.json(enrichedDebts);
  } catch (e) {
    next(e);
  }
});

groupsRouter.post(
  "/join",
  body("groupId").trim().notEmpty().withMessage("Group ID or invite code is required"),
  async (req: AuthRequest, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
      const group = await GroupService.joinGroup(userId, req.body.groupId);
      res.json({ message: "Successfully joined group!", group });
    } catch (e) {
      next(e);
    }
  }
);
