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
import { updateExchangeRates } from "./services/currency.js";

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

app.get("/privacy", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Privacy Policy - SahiSplit</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; background: #fafafa; }
            h1 { color: #6366F1; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            h2 { color: #444; margin-top: 30px; }
            .container { background: white; padding: 40px; border-radius: 12px; shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #eee; }
            footer { margin-top: 40px; text-align: center; font-size: 0.9em; color: #888; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Privacy Policy for SahiSplit</h1>
            <p>Last updated: February 15, 2026</p>
            
            <p>Your privacy is important to us. This Privacy Policy explains how SahiSplit ("we", "us", or "our") collects, uses, and protects your information when you use our mobile application.</p>
            
            <h2>1. Information We Collect</h2>
            <p><strong>Personal Data:</strong> We collect your name, email address, and username when you register an account. This is used to identify you and allow you to interact with other users (friends and groups).</p>
            <p><strong>Financial Data:</strong> SahiSplit is an expense tracking tool. We store data about your shared expenses, splits, and settlements. We do NOT process actual payments or store bank account/credit card details.</p>
            <p><strong>Biometric Data:</strong> If you enable FaceID or Fingerprint lock, this is handled entirely by your device's operating system. We do NOT have access to or store your biometric data.</p>
            
            <h2>2. How We Use Your Information</h2>
            <p>We use your data to:</p>
            <ul>
                <li>Provide and maintain our service.</li>
                <li>Allow you to create groups and split bills with friends.</li>
                <li>Send you OTP (One-Time Password) emails for secure login.</li>
                <li>Calculate balances and settlements between you and your contacts.</li>
            </ul>
            
            <h2>3. Data Sharing</h2>
            <p>We do not sell your personal data. Your name and email are shared only with the users you explicitly add as friends or group members to facilitate expense splitting.</p>
            
            <h2>4. Security</h2>
            <p>We use industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>
            
            <h2>5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, you can contact us at: piyushpar7@gmail.com</p>
        </div>
        <footer>&copy; 2026 SahiSplit. All rights reserved.</footer>
    </body>
    </html>
  `);
});

app.use(errorHandler);


// Initialize Services (Skip on Vercel to avoid cold-start scheduler duplication)
if (!process.env.VERCEL) {
  initScheduler();
  updateExchangeRates().catch(console.error);
}

const HOST = '0.0.0.0';

if (!process.env.VERCEL) {
  app.listen(Number(PORT), HOST, () => {
    console.log(`SplitItUp API running at http://${HOST}:${PORT}`);
  });
}

export default app;
