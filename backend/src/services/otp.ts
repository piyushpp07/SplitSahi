import { prisma } from "../lib/prisma.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dns from "dns";

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

// Setup transporter using the "service" shortcut which handles most Gmail-specific quirks
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // High timeouts for cloud reliability
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

// Logs for Render Dashboard to verify env vars are reaching the app
console.log("[OTP] Mail Service initialized with config:", {
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS ? "PRESENT" : "MISSING",
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE
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
  console.log(`[OTP] 🚀 Attempting email send to ${email}`);
  console.log(`[OTP] FALLBACK/DEV CODE FOR ${email}: ${code}`);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[OTP] SMTP credentials missing. Please set SMTP_USER and SMTP_PASS in Render.");
    return;
  }

  try {
    await transporter.sendMail({
      from: `"SplitSahi" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "SplitSahi - Your Verification Code",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #059669; text-align: center;">Verify Your Email</h2>
          <p>Hi there,</p>
          <p>Thank you for joining SplitItUp! Use the code below to complete your registration:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${code}</span>
          </div>
          <p>This code will expire in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>. If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">SplitItUp - Manage shared expenses with ease.</p>
        </div>
      `,
    });
    console.log(`[OTP] Email sent successfully to ${email}`);
  } catch (error: any) {
    console.error(`[OTP] ❌ Failed to send email to ${email}:`, error.message);
    if (error.response) {
      console.error(`[OTP] SMTP Response:`, error.response);
    }
    console.log(`[OTP] FALLBACK: GENERATED CODE FOR ${email} IS: ${code}`);
  }
}

/**
 * Send OTP via SMS
 */
async function sendSMSOTP(phone: string, code: string): Promise<void> {
  const SMS_TEMPLATE_ID = "698b679cbbc7021af67771f6";

  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID || "";

  if (authKey) {
    try {
      const mobile = phone.startsWith("+") ? phone.slice(1) : phone;
      let url = `https://control.msg91.com/api/v5/otp?template_id=${SMS_TEMPLATE_ID}&mobile=${mobile}&authkey=${authKey}&otp=${code}&realTimeResponse=1`;

      if (senderId) {
        url += `&sender=${senderId}`;
      }

      console.log(`[OTP] 🚀 Calling Msg91 for ${phone}...`);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: code // Matches ##number## in user template
        })
      });

      const result = await response.json() as any;
      console.log("[OTP] Msg91 Response:", JSON.stringify(result, null, 2));

      if (result.type === "error") {
        console.error(`[OTP] Msg91 rejected the request: ${result.message}`);
      }
    } catch (err) {
      console.error("[OTP] Msg91 network or parsing error:", err);
    }
  } else {
    console.log(`[OTP] NO AUTH KEY - FALLBACK CODE FOR ${phone}: ${code}`);
  }
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
      // For phone, we try to send SMS
      await sendSMSOTP(identifier, code);

      // If we're in development or no SMS key is present, we should also log it clearly for the user
      if (process.env.NODE_ENV !== "production" || !process.env.MSG91_AUTH_KEY) {
        console.log("\n" + "=".repeat(40));
        console.log(`[OTP] 📧 EMAIL FALLBACK (if registered): ${identifier}`);
        console.log(`[OTP] 🔑 CODE: ${code}`);
        console.log("=".repeat(40) + "\n");
      }
    }

    console.log("\n" + "=".repeat(40));
    console.log(`[OTP] 🔑 VERIFICATION CODE: ${code}`);
    console.log(`[OTP] 📱 TO: ${identifier}`);
    console.log("=".repeat(40) + "\n");

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

export async function verifyOTP(
  identifier: string,
  code: string,
  type: "email" | "phone"
): Promise<{ success: boolean; message: string }> {
  try {
    // Master OTP for development AND prod recovery
    if (code === "111111") {
      console.log(`[OTP] 🚨 EMERGENCY MASTER OTP (111111) USED FOR ${identifier}`);

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
      return { success: true, message: "Verification successful (Master OTP)" };
    }

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
