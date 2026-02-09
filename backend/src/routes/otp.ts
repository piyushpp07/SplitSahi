import { Router } from "express";
import { body, validationResult } from "express-validator";
import { sendOTP, verifyOTP } from "../services/otp.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export const otpRouter = Router();

// Send OTP to email or phone
otpRouter.post(
  "/send",
  body("identifier").trim().notEmpty().withMessage("Email or phone is required"),
  body("type").isIn(["email", "phone"]).withMessage("Type must be 'email' or 'phone'"),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, errors.array()[0].msg, "VALIDATION_ERROR");
      }

      const { identifier, type } = req.body;

      // Basic validation
      if (type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(identifier)) {
          throw new AppError(400, "Invalid email format", "VALIDATION_ERROR");
        }
      } else if (type === "phone") {
        // Basic phone validation (adjust regex as needed)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(identifier.replace(/[\s-]/g, ""))) {
          throw new AppError(400, "Invalid phone format", "VALIDATION_ERROR");
        }
      }

      const result = await sendOTP(identifier, type);

      if (!result.success) {
        throw new AppError(500, result.message, "OTP_SEND_FAILED");
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (e) {
      next(e);
    }
  }
);

// Verify OTP code
otpRouter.post(
  "/verify",
  body("identifier").trim().notEmpty().withMessage("Email or phone is required"),
  body("code").trim().isLength({ min: 6, max: 6 }).withMessage("OTP code must be 6 digits"),
  body("type").isIn(["email", "phone"]).withMessage("Type must be 'email' or 'phone'"),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, errors.array()[0].msg, "VALIDATION_ERROR");
      }

      const { identifier, code, type } = req.body;

      const result = await verifyOTP(identifier, code, type);

      if (!result.success) {
        throw new AppError(400, result.message, "OTP_VERIFICATION_FAILED");
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (e) {
      next(e);
    }
  }
);

// Search for users by email or phone (for friend discovery)
otpRouter.get("/search", async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      throw new AppError(400, "Search query is required", "VALIDATION_ERROR");
    }

    // Search by email or phone
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        emailVerified: true,
        phoneVerified: true,
      },
      take: 10,
    });

    res.json({ users });
  } catch (e) {
    next(e);
  }
});

// Check if email/phone is already registered
otpRouter.post("/check-availability", async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    const results: { email?: boolean; phone?: boolean } = {};

    if (email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      results.email = !emailExists; // true if available
    }

    if (phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone },
        select: { id: true },
      });
      results.phone = !phoneExists; // true if available
    }

    res.json({ available: results });
  } catch (e) {
    next(e);
  }
});
