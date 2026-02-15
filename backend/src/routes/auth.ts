import { Router } from "express";
import { body, validationResult } from "express-validator";
import { register, login, checkUsername } from "../services/auth.js";
import { AppError } from "../middleware/errorHandler.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("username").trim().isLength({ min: 3 }).matches(/^[a-zA-Z0-9_]+$/).withMessage("Username must be at least 3 chars alphanumeric"),
  body("emoji").optional(),
  async (req, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const { email, password, name, username, emoji } = req.body;
      const result = await register(email, password, name, username, emoji);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  }
);

authRouter.get("/check-username", async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) throw new AppError(400, "Username is required", "MISSING_USERNAME");
    const result = await checkUsername(username as string);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

authRouter.post(
  "/login",
  body("identifier").notEmpty(),
  body("password").notEmpty(),
  async (req, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const { identifier, password } = req.body;
      const result = await login(identifier, password);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

authRouter.post(
  "/verify-otp",
  body("identifier").notEmpty(),
  body("otp").isLength({ min: 6, max: 6 }),
  async (req, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const { identifier, otp, type } = req.body;
      const result = await import("../services/auth.js").then(m => m.verifyOTPIdentifier(identifier, otp, type || "phone"));
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

authRouter.post(
  "/send-otp",
  body("identifier").notEmpty(),
  async (req, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const { identifier, type } = req.body;
      const { sendOTP } = await import("../services/otp.js");

      // Basic identifier verification (generic)
      await sendOTP(identifier, type || "email");
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (e) {
      next(e);
    }
  }
);

authRouter.post(
  "/forgot-password",
  body("email").isEmail().normalizeEmail(),
  async (req, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const { email } = req.body;
      const { forgotPasswordOTP } = await import("../services/auth.js");
      const result = await forgotPasswordOTP(email);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

authRouter.post(
  "/reset-password",
  body("email").isEmail().normalizeEmail(),
  body("otp").isLength({ min: 6, max: 6 }),
  body("newPassword").isLength({ min: 6 }),
  async (req, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const { email, otp, newPassword } = req.body;
      await import("../services/auth.js").then(m => m.resetPassword(email, otp, newPassword));
      res.json({ success: true, message: "Password reset successfully" });
    } catch (e) {
      next(e);
    }
  }
);
