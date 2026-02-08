import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler.js";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "Missing or invalid authorization header", "UNAUTHORIZED"));
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token", "UNAUTHORIZED"));
  }
}

export async function authMiddlewareOptional(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { id: payload.userId, email: payload.email };
  } catch {
    // ignore
  }
  next();
}

export async function requireUser(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return next(new AppError(401, "User not found", "USER_NOT_FOUND"));
  }
  (req as AuthRequest & { userEntity: typeof user }).userEntity = user;
  next();
}
