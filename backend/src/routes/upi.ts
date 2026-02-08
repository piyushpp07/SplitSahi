import { Router } from "express";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export const upiRouter = Router();
upiRouter.use(authMiddleware);
upiRouter.use(requireUser);

/**
 * Get UPI deep link for payment (GPay / PhonePe / Paytm).
 * Format: upi://pay?pa=UPI_ID&pn=Name&am=Amount&cu=INR
 */
upiRouter.get("/pay-link", async (req: AuthRequest, res, next) => {
  try {
    const toUserId = req.query.toUserId as string;
    const amount = req.query.amount as string;
    if (!toUserId || !amount) throw new AppError(400, "toUserId and amount required", "VALIDATION_ERROR");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) throw new AppError(400, "Invalid amount", "VALIDATION_ERROR");

    const toUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { upiId: true, name: true },
    });
    if (!toUser) throw new AppError(404, "User not found", "NOT_FOUND");
    if (!toUser.upiId) throw new AppError(400, "User has no UPI ID", "NO_UPI_ID");

    const pa = encodeURIComponent(toUser.upiId);
    const pn = encodeURIComponent(toUser.name);
    const am = amt.toFixed(2);
    const cu = "INR";
    const link = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}`;
    res.json({ link, upiId: toUser.upiId, name: toUser.name, amount: am });
  } catch (e) {
    next(e);
  }
});
