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

export async function checkUsername(username: string) {
  const existing = await prisma.user.findUnique({ where: { username } });
  return { available: !existing };
}

export async function register(email: string | undefined, password: string | undefined, name: string, phone: string, username: string, emoji?: string, skipOTP: boolean = false) {
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(400, "Email already registered", "EMAIL_EXISTS");
  }

  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) throw new AppError(400, "Phone already registered", "PHONE_EXISTS");

  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) throw new AppError(400, "Username already taken", "USERNAME_TAKEN");

  const passwordHash = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;
  const user = await prisma.user.create({
    data: {
      email: email || null,
      name,
      username,
      emoji: emoji || null,
      passwordHash,
      phone,
      phoneVerified: skipOTP,
      emailVerified: false
    },
    select: { id: true, email: true, name: true, phone: true, username: true, emoji: true, upiId: true, avatarUrl: true, createdAt: true },
  });

  if (skipOTP) {
    const token = jwt.sign(
      { userId: user.id, email: user.email || "" } as JwtPayload,
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    return { user, token, needsVerification: false };
  }

  // Send OTP - Use email if provided, otherwise fallback to phone
  const { sendOTP } = await import("./otp.js");
  if (email) {
    await sendOTP(email, "email");
  } else {
    await sendOTP(phone, "phone");
  }

  return { user, needsVerification: true };
}

export async function verifyOTPIdentifier(identifier: string, otp: string, type: "phone" | "email" = "email") {
  const result = await verifyOTP(identifier, otp, type);
  if (!result.success) throw new AppError(400, result.message, "OTP_VERIFICATION_FAILED");

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { phone: identifier }
      ]
    }
  }) as any;

  if (!user) {
    return {
      needsRegistration: true,
      verifiedIdentifier: identifier,
      type
    };
  }

  // Mark as verified
  await prisma.user.update({
    where: { id: user.id },
    data: type === "phone" ? { phoneVerified: true } : { emailVerified: true }
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email || "" } as JwtPayload,
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      emoji: user.emoji,
      phone: user.phone,
      upiId: user.upiId,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function login(identifier: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { phone: identifier },
        { username: identifier }
      ]
    }
  }) as any;

  if (!user?.passwordHash) throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");

  const token = jwt.sign(
    { userId: user.id, email: user.email || "" } as JwtPayload,
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      emoji: user.emoji,
      phone: user.phone,
      upiId: user.upiId,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    token,
  };
}
