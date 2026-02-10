import { Router } from "express";
import { body, validationResult } from "express-validator";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export const usersRouter = Router();
usersRouter.use(authMiddleware);
usersRouter.use(requireUser);

usersRouter.get("/me", async (req: AuthRequest, res, next) => {
  try {
    const user = (req as AuthRequest & { userEntity: { id: string } }).userEntity;
    const u = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, phone: true, upiId: true, avatarUrl: true, emoji: true, currency: true, createdAt: true },
    });
    if (!u) throw new AppError(404, "User not found", "NOT_FOUND");
    res.json(u);
  } catch (e) {
    next(e);
  }
});

usersRouter.patch(
  "/me",
  body("name").optional().trim().notEmpty(),
  body("phone").optional().trim(),
  body("upiId")
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)
    .withMessage("Invalid UPI ID format (e.g., name@bank)"),
  body("avatarUrl").optional().trim(),
  body("emoji").optional().trim(),
  async (req: AuthRequest, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const user = (req as AuthRequest & { userEntity: { id: string } }).userEntity;
      const { name, phone, upiId, avatarUrl, emoji } = req.body;
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name, phone, upiId, avatarUrl, emoji },
        select: { id: true, email: true, name: true, phone: true, upiId: true, avatarUrl: true, emoji: true, currency: true },
      });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

// Search users by phone/email for adding friends
usersRouter.get("/search", async (req: AuthRequest, res, next) => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q || q.length < 2) {
      return res.json([]);
    }
    const currentUserId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, emoji: true },
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

// Categories for smart categorization
usersRouter.get("/categories", async (_req, res, next) => {
  try {
    const { getCategories } = await import("../services/smartCategories.js");
    res.json(getCategories());
  } catch (e) {
    next(e);
  }
});
