import { Router } from "express";
import { body, validationResult } from "express-validator";
import { register, login } from "../services/auth.js";
import { AppError } from "../middleware/errorHandler.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("name").trim().notEmpty(),
  body("phone").optional().trim(),
  async (req, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const { email, password, name, phone } = req.body;
      const result = await register(email, password, name, phone);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  }
);

authRouter.post(
  "/login",
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  async (req, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const { email, password } = req.body;
      const result = await login(email, password);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

authRouter.post(
  "/verify-email",
  body("email").isEmail().normalizeEmail(),
  body("otp").isLength({ min: 6, max: 6 }),
  async (req, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) throw new AppError(400, err.array()[0].msg, "VALIDATION_ERROR");
      const { email, otp } = req.body;
      // Dynamic import to avoid circular dependency if any (though standard import is fine here)
      // Switching to standard import pattern if cleaner, but consistent with existing file
      const result = await import("../services/auth.js").then(m => m.verifyEmail(email, otp));
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
