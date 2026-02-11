import { Router } from "express";
import { body, validationResult } from "express-validator";
import { sendOTP, verifyOTP } from "../services/otp.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export const otpRouter = Router();

// Send OTP to email or phone
// Send OTP to email
otpRouter.post(
  "/send",
  body("identifier").trim().isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("type").equals("email").withMessage("Type must be 'email'"),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, errors.array()[0].msg, "VALIDATION_ERROR");
      }

      const { identifier, type } = req.body;
      const result = await sendOTP(identifier, type);

      if (!result.success) {
        throw new AppError(500, result.message, "OTP_SEND_FAILED");
      }

      res.json({
        success: true,
        message: result.message,
        code: result.code // Include code only in dev/test for convenience, usually sanitized in prod
      });
    } catch (e) {
      next(e);
    }
  }
);

// Verify OTP code
otpRouter.post(
  "/verify",
  body("identifier").trim().isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("code").trim().isLength({ min: 6, max: 6 }).withMessage("OTP code must be 6 digits"),
  body("type").equals("email").withMessage("Type must be 'email'"),
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

// Search for users by email (for friend discovery)
otpRouter.get("/search", async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      throw new AppError(400, "Search query is required", "VALIDATION_ERROR");
    }

    // Search by email only
    const users = await prisma.user.findMany({
      where: {
        email: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatarUrl: true,
        emailVerified: true,
      },
      take: 10,
    });

    res.json({ users });
  } catch (e) {
    next(e);
  }
});

// Check if email is already registered
otpRouter.post("/check-availability", async (req, res, next) => {
  try {
    const { email } = req.body;

    const results: { email?: boolean } = {};

    if (email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      results.email = !emailExists; // true if available
    }

    res.json({ available: results });
  } catch (e) {
    next(e);
  }
});
