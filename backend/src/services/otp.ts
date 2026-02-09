import { prisma } from "../lib/prisma.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

// Setup email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Generate a random 6-digit OTP code
 */
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Send OTP via email using nodemailer
 */
async function sendEmailOTP(email: string, code: string): Promise<void> {
  console.log(`[OTP] Sending actual email OTP to ${email}`);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[OTP] SMTP credentials not set. Falling back to console log.");
    console.log(`[OTP] DEV CODE FOR ${email}: ${code}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"SplitSahiSe" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "SplitSahiSe - Your Verification Code",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #059669; text-align: center;">Verify Your Email</h2>
          <p>Hi there,</p>
          <p>Thank you for joining SplitSahiSe! Use the code below to complete your registration:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${code}</span>
          </div>
          <p>This code will expire in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>. If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">SplitSahiSe - Manage shared expenses with ease.</p>
        </div>
      `,
    });
    console.log(`[OTP] Email sent successfully to ${email}`);
  } catch (error) {
    console.error("[OTP] Failed to send email:", error);
    throw new Error("Could not send verification email");
  }
}

/**
 * Send OTP via SMS
 * TODO: Integrate with Twilio or similar SMS service
 */
async function sendSMSOTP(phone: string, code: string): Promise<void> {
  console.log(`[OTP] Sending SMS OTP to ${phone}: ${code}`);

  // For development: just log the OTP
  // In production, integrate with Twilio:
  /*
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  await client.messages.create({
    body: `Your SplitSahiSe verification code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
  */
}

/**
 * Generate and send OTP
 */
export async function sendOTP(
  identifier: string,
  type: "email" | "phone"
): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Delete any existing unverified OTPs for this identifier
    await prisma.oTPVerification.deleteMany({
      where: {
        identifier,
        type,
        verified: false,
      },
    });

    // Create new OTP record
    await prisma.oTPVerification.create({
      data: {
        identifier,
        code,
        type,
        expiresAt,
      },
    });

    // Send OTP
    if (type === "email") {
      await sendEmailOTP(identifier, code);
    } else {
      await sendSMSOTP(identifier, code);
    }

    return {
      success: true,
      message: `OTP sent to ${type === "email" ? "email" : "phone number"}`,
      code, // Return code for dev usage
    };
  } catch (error) {
    console.error("[OTP] Error sending OTP:", error);
    return {
      success: false,
      message: "Failed to send OTP. Please try again.",
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  identifier: string,
  code: string,
  type: "email" | "phone"
): Promise<{ success: boolean; message: string }> {
  try {
    // Find OTP record
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        identifier,
        code,
        type,
        verified: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return {
        success: false,
        message: "Invalid OTP code",
      };
    }

    // Check if expired
    if (new Date() > otpRecord.expiresAt) {
      return {
        success: false,
        message: "OTP code has expired. Please request a new one.",
      };
    }

    // Mark as verified
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Update user verification status
    if (type === "email") {
      await prisma.user.updateMany({
        where: { email: identifier },
        data: { emailVerified: true },
      });
    } else {
      await prisma.user.updateMany({
        where: { phone: identifier },
        data: { phoneVerified: true },
      });
    }

    return {
      success: true,
      message: "Verification successful",
    };
  } catch (error) {
    console.error("[OTP] Error verifying OTP:", error);
    return {
      success: false,
      message: "Verification failed. Please try again.",
    };
  }
}

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
