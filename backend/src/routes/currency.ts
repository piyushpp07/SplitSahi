import { Router } from "express";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { SUPPORTED_CURRENCIES, getExchangeRate, convertCurrency } from "../services/currency.js";
import { AppError } from "../middleware/errorHandler.js";

export const currencyRouter = Router();

// Public routes (no auth required)

// Get list of supported currencies
currencyRouter.get("/", (req, res) => {
  res.json({ currencies: SUPPORTED_CURRENCIES });
});

// Get exchange rate between two currencies
currencyRouter.get("/rate", async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      throw new AppError(400, "Missing 'from' or 'to' currency parameter", "VALIDATION_ERROR");
    }

    const rate = await getExchangeRate(from as string, to as string);

    res.json({
      from,
      to,
      rate,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

// Convert amount between currencies
currencyRouter.get("/convert", async (req, res, next) => {
  try {
    const { amount, from, to } = req.query;

    if (!amount || !from || !to) {
      throw new AppError(400, "Missing required parameters: amount, from, to", "VALIDATION_ERROR");
    }

    const amountNum = parseFloat(amount as string);
    if (isNaN(amountNum)) {
      throw new AppError(400, "Invalid amount", "VALIDATION_ERROR");
    }

    const converted = await convertCurrency(amountNum, from as string, to as string);
    const rate = await getExchangeRate(from as string, to as string);

    res.json({
      original: {
        amount: amountNum,
        currency: from,
      },
      converted: {
        amount: converted,
        currency: to,
      },
      rate,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

// Protected routes (require authentication)
currencyRouter.use(authMiddleware);
currencyRouter.use(requireUser);

// Update user's preferred currency
interface CustomRequest extends Router {
  userEntity?: { id: string };
  body: { currency?: string };
}

currencyRouter.patch("/preference", async (req: any, res, next) => {
  try {
    const userId = req.userEntity?.id;
    const { currency } = req.body;

    if (!currency) {
      throw new AppError(400, "Currency is required", "VALIDATION_ERROR");
    }

    // Validate currency
    const isValid = SUPPORTED_CURRENCIES.some(c => c.code === currency);
    if (!isValid) {
      throw new AppError(400, "Unsupported currency", "VALIDATION_ERROR");
    }

    const { prisma } = await import("../lib/prisma.js");
    const user = await prisma.user.update({
      where: { id: userId },
      data: { currency },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
      },
    });

    res.json(user);
  } catch (e) {
    next(e);
  }
});
