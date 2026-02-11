import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { groupsRouter } from "./routes/groups.js";
import { expensesRouter } from "./routes/expenses.js";
import { settlementsRouter } from "./routes/settlements.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { activityRouter } from "./routes/activity.js";
import { upiRouter } from "./routes/upi.js";
import { friendshipsRouter } from "./routes/friendships.js";
import { friendBalanceRouter } from "./routes/friendBalance.js";
import { analyticsRouter } from "./routes/analytics.js";
import { currencyRouter } from "./routes/currency.js";
import { otpRouter } from "./routes/otp.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { initScheduler } from "./services/scheduler.js";
import { initCurrencyService } from "./services/currency.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/settlements", settlementsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/activity", activityRouter);
app.use("/api/upi", upiRouter);
app.use("/api/friendships", friendshipsRouter);
app.use("/api/friend-balance", friendBalanceRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/currency", currencyRouter);
app.use("/api/otp", otpRouter);

app.get("/health", (_req, res) => res.json({ ok: true, service: "splititup-api" }));

app.use(errorHandler);


// Initialize Services
initScheduler();
initCurrencyService();

const HOST = '0.0.0.0';
app.listen(Number(PORT), HOST, () => {
  console.log(`SplitItUp API running at http://${HOST}:${PORT}`);
});
