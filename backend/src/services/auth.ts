import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type { JwtPayload } from "../middleware/auth.js";
import { verifyOTP } from "./otp.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const SALT_ROUNDS = 10;

export async function resetPassword(email: string, otp: string, newPassword: string) {
  const lowerEmail = email.toLowerCase().trim();
  const result = await verifyOTP(lowerEmail, otp, "email");
  if (!result.success) throw new AppError(400, result.message, "OTP_VERIFICATION_FAILED");

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { email: lowerEmail },
    data: { passwordHash },
  });
  return { success: true };
}

export async function checkUsername(username: string) {
  const normalized = username.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { username: normalized } });
  return { available: !existing };
}

export async function register(email: string, password: string, name: string, username: string, emoji?: string, skipOTP: boolean = false) {
  const lowerEmail = email.toLowerCase().trim();
  const lowerUsername = username.toLowerCase().trim();

  // 1. Check if email exists
  if (lowerEmail) {
    const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
    if (existing) throw new AppError(400, "Email already registered", "EMAIL_EXISTS");
  }

  // 2. Check username
  const existingUser = await prisma.user.findUnique({ where: { username: lowerUsername } });
  if (existingUser) throw new AppError(400, "Username already taken", "USERNAME_TAKEN");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Create user
  const user = await prisma.user.create({
    data: {
      email: lowerEmail,
      name,
      username: lowerUsername,
      emoji: emoji || null,
      passwordHash,
      emailVerified: skipOTP,
      phone: null,
      phoneVerified: false
    },
    select: { id: true, email: true, name: true, username: true, emoji: true, upiId: true, avatarUrl: true, createdAt: true },
  });

  if (skipOTP) {
    const token = jwt.sign(
      { userId: user.id, email: user.email || "" } as JwtPayload,
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    return { user, token, needsVerification: false };
  }

  // 4. Send OTP to email
  const { sendOTP } = await import("./otp.js");
  await sendOTP(lowerEmail, "email");

  return { user, needsVerification: true };
}

export async function verifyOTPIdentifier(identifier: string, otp: string, type: "phone" | "email" = "email") {
  const normalized = identifier.toLowerCase().trim();
  // We only support email verification for now based on requirements
  if (type !== 'email') {
    throw new AppError(400, "Only email verification is supported", "INVALID_TYPE");
  }

  const result = await verifyOTP(normalized, otp, type);
  if (!result.success) throw new AppError(400, result.message, "OTP_VERIFICATION_FAILED");

  const user = await prisma.user.findUnique({
    where: { email: normalized }
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
    data: { emailVerified: true }
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
      upiId: user.upiId,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function login(identifier: string, password: string) {
  const lowerIdentifier = identifier.toLowerCase().trim();
  // Login with Email or Username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: lowerIdentifier },
        { username: lowerIdentifier }
      ]
    }
  }) as any;

  if (!user || !user.passwordHash) throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");

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
      upiId: user.upiId,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    token,
  };
}
