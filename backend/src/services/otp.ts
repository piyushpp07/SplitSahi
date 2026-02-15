import { prisma } from "../lib/prisma.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dns from "dns";

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

async function sendEmailOTP(email: string, code: string): Promise<boolean> {
  console.log(`[OTP] 🚀 Attempting email send to ${email} via Nodemailer`);

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("[OTP] ❌ SMTP credentials missing (SMTP_USER/SMTP_PASS).");
    console.log(`[OTP] FOR DEV/DEBUG: Code for ${email} is: ${code}`);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `SplitItUp <${user}>`,
      to: email,
      subject: "SplitItUp - Your Verification Code",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #059669; text-align: center;">Verify Your Email</h2>
          <p>Hi there,</p>
          <p>Use the code below to complete your registration:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${code}</span>
          </div>
          <p>Expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
        </div>
      `,
    });

    console.log(`[OTP] ✅ Email sent successfully to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`[OTP] ❌ Nodemailer Error:`, error.message);
    return false;
  }
}

/**
 * Generate and send OTP
 */
export async function sendOTP(
  identifier: string,
  type: "email" | "phone",
  metadata?: any
): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Clean old OTPs
    await prisma.oTPVerification.deleteMany({
      where: { identifier, type, verified: false },
    });

    // Create new OTP record with metadata
    await prisma.oTPVerification.create({
      data: {
        identifier,
        code,
        type,
        expiresAt,
        metadata: metadata || undefined,
      } as any,
    });

    let isEmailFailure = false;
    if (type === "email") {
      const success = await sendEmailOTP(identifier, code);
      isEmailFailure = !success;
    } else {
      return { success: false, message: "SMS verification is disabled. Please use email." };
    }

    console.log("\n" + "=".repeat(40));
    console.log(`[OTP] 🔑 ${isEmailFailure ? "❌ EMAIL FAILED -> USE THIS CODE" : "VERIFICATION CODE"}: ${code}`);
    console.log(`[OTP] 📱 TO: ${identifier}`);
    console.log("=".repeat(40) + "\n");

    return {
      success: true,
      message: `OTP sent to ${type}`,
      code,
    };
  } catch (error) {
    console.error("[OTP] Error sending OTP:", error);
    return { success: false, message: "Failed to send OTP. Please try again." };
  }
}

export async function verifyOTP(
  identifier: string,
  code: string,
  type: "email" | "phone"
): Promise<{ success: boolean; message: string; metadata?: any }> {
  try {
    // Find OTP record
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: { identifier, type, verified: false },
      orderBy: { createdAt: "desc" },
    });

    // Master OTP check: Always allow 111111 for the Google reviewer or in non-prod
    const isReviewer = identifier === "google-reviewer@splitsahi.com";
    const isMaster = (process.env.NODE_ENV !== "production" || isReviewer) && code === "111111";

    if (!otpRecord) {
      if (isMaster) return { success: true, message: "Reviewer bypass", metadata: { intent: "LOGIN" } };
      return { success: false, message: "Invalid OTP code (No records found)" };
    }

    if (!isMaster && otpRecord.code !== code) {
      return { success: false, message: "Invalid OTP code" };
    }

    if (new Date() > otpRecord.expiresAt) {
      return { success: false, message: "OTP expired" };
    }

    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    return {
      success: true,
      message: "Verification successful",
      metadata: (otpRecord as any).metadata,
    };
  } catch (error) {
    console.error("[OTP] Error verifying OTP:", error);
    return { success: false, message: "Verification failed" };
  }
}

// Keeping this for compatibility if referenced elsewhere
export const verifyOTPWithMaster = verifyOTP;

/**
 * Clean up expired OTP records (run periodically)
 */
export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    const result = await prisma.oTPVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    console.log(`[OTP] Cleaned up ${result.count} expired OTP records`);
  } catch (error) {
    console.error("[OTP] Error cleaning up OTPs:", error);
  }
}
