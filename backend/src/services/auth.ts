import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type { JwtPayload } from "../middleware/auth.js";
import { verifyOTP } from "./otp.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const SALT_ROUNDS = 10;

export async function resetPassword(email: string, otp: string, newPassword: string) {
  const result = await verifyOTP(email, otp, "email");
  if (!result.success) throw new AppError(400, result.message, "OTP_VERIFICATION_FAILED");

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });
  return { success: true };
}

export async function register(email: string, password: string, name: string, phone?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(400, "Email already registered", "EMAIL_EXISTS");
  if (phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) throw new AppError(400, "Phone already registered", "PHONE_EXISTS");
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, phone, emailVerified: true }, // Auto-verify for now
    select: { id: true, email: true, name: true, phone: true, upiId: true, avatarUrl: true, createdAt: true },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email } as JwtPayload,
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { user, token };
}

export async function verifyEmail(email: string, otp: string) {
  const result = await verifyOTP(email, otp, "email");
  if (!result.success) throw new AppError(400, result.message, "OTP_VERIFICATION_FAILED");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");

  // Generate token only after verification
  const token = jwt.sign(
    { userId: user.id, email: user.email } as JwtPayload,
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      upiId: user.upiId,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");

  // if (!user.emailVerified) {
  //   throw new AppError(403, "Email not verified. Please verify your email first.", "EMAIL_NOT_VERIFIED");
  // }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");

  const token = jwt.sign(
    { userId: user.id, email: user.email } as JwtPayload,
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      upiId: user.upiId,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    token,
  };
}
