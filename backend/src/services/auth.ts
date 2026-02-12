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

  // 1. Find user first to check old password
  const user = await prisma.user.findUnique({ where: { email: lowerEmail } });
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");

  // 2. Verify OTP
  const result = await verifyOTP(lowerEmail, otp, "email");
  if (!result.success) throw new AppError(400, result.message, "OTP_VERIFICATION_FAILED");

  // 3. Prevent same password
  const isSame = await bcrypt.compare(newPassword, user.passwordHash!);
  if (isSame) throw new AppError(400, "New password cannot be the same as your old password", "SAME_PASSWORD");

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { email: lowerEmail },
    data: {
      passwordHash,
      emailVerified: true // Ensure verified after reset
    },
  });
  return { success: true };
}

export async function changePassword(userId: string, oldPass: string, newPass: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) throw new AppError(404, "User not found", "NOT_FOUND");

  // 1. Verify old password
  const ok = await bcrypt.compare(oldPass, user.passwordHash);
  if (!ok) throw new AppError(401, "Invalid old password", "INVALID_OLD_PASSWORD");

  // 2. Prevent same password
  if (oldPass === newPass) throw new AppError(400, "New password cannot be the same as old one", "SAME_PASSWORD");

  const isSame = await bcrypt.compare(newPass, user.passwordHash);
  if (isSame) throw new AppError(400, "New password cannot be the same as old one", "SAME_PASSWORD");

  const passwordHash = await bcrypt.hash(newPass, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: true };
}

export async function checkUsername(username: string) {
  const normalized = username.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { username: normalized } });
  return { available: !existing };
}

export async function register(email: string, password: string, name: string, username: string, emoji?: string) {
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
      emailVerified: false,
      phone: null,
      phoneVerified: false
    },
    select: { id: true, email: true, name: true, username: true, emoji: true, upiId: true, avatarUrl: true, createdAt: true },
  });

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

  // Check if email is verified
  if (!user.emailVerified) {
    // Send OTP again if they try to login but aren't verified
    const { sendOTP } = await import("./otp.js");
    await sendOTP(user.email, "email");
    throw new AppError(403, "Email not verified. A new verification code has been sent to your email.", "EMAIL_NOT_VERIFIED", { email: user.email });
  }

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
