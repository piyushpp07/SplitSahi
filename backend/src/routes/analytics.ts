import { Router } from "express";
import { authMiddleware, requireUser, type AuthRequest } from "../middleware/auth.js";
import { getUserSpendingAnalytics } from "../services/analytics.js";

export const analyticsRouter = Router();

analyticsRouter.use(authMiddleware);
analyticsRouter.use(requireUser);

analyticsRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const userId = (req as AuthRequest & { userEntity: { id: string } }).userEntity.id;
    const data = await getUserSpendingAnalytics(userId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});
