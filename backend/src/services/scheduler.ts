import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { RecurringFrequency, SplitType } from "@prisma/client";
import { logActivity, ActivityType, sendNotification } from "./activity.js";

import { updateExchangeRates } from "./currency.js";

export function initScheduler() {
  console.log("Initializing Recurring Expense Scheduler...");

  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    console.log(`[Scheduler] Checking for recurring expenses at ${new Date().toISOString()}`);
    await processRecurringExpenses();
  });

  // Run every day at midnight (Currency Update)
  cron.schedule("0 0 * * *", async () => {
    console.log(`[Scheduler] Updating exchange rates...`);
    await updateExchangeRates();
  });
}

async function processRecurringExpenses() {
  try {
    const now = new Date();

    const dueExpenses = await prisma.recurringExpense.findMany({
      where: {
        isActive: true,
        nextRunDate: {
          lte: now,
        },
      },
      include: {
        creator: true
      }
    });

    if (dueExpenses.length > 0) {
      console.log(`[Scheduler] Found ${dueExpenses.length} due recurring expenses.`);
    }

    for (const re of dueExpenses) {
      await processSingleRecurringExpense(re);
    }
  } catch (error) {
    console.error(`[Scheduler] Error running process:`, error);
  }
}

async function processSingleRecurringExpense(re: any) {
  try {
    console.log(`[Scheduler] Processing Recurring Expense: ${re.title} (${re.id})`);

    const participantIds = re.participants as string[];
    const splitsData = re.splits as any[];

    // Create the expense transactionally
    await prisma.$transaction(async (tx) => {
      // 1. Create Expense
      const expense = await tx.expense.create({
        data: {
          title: re.title,
          description: "Recurring Expense",
          totalAmount: re.amount,
          category: re.category,
          currency: "INR",
          splitType: re.splitType as SplitType,
          groupId: re.groupId,
          createdById: re.createdById,
          expenseDate: new Date(),
        },
      });

      // 2. Create Payers (Creator pays fully)
      await tx.expensePayer.create({
        data: {
          expenseId: expense.id,
          userId: re.createdById,
          amountPaid: re.amount,
        },
      });

      // 3. Create Participants
      await tx.expenseParticipant.createMany({
        data: participantIds.map((uid: string) => ({
          expenseId: expense.id,
          userId: uid,
        })),
        skipDuplicates: true,
      });

      // 4. Create Splits
      if (re.splitType === "EQUAL") {
        const share = Number(re.amount) / participantIds.length;
        await tx.expenseSplit.createMany({
          data: participantIds.map((uid: string) => ({
            expenseId: expense.id,
            userId: uid,
            amountOwed: share, // Decimal checks not strictly enforced here but okay
          })),
        });
      } else if (splitsData) {
        // EXACT, PERCENTAGE, SHARE
        await tx.expenseSplit.createMany({
          data: splitsData.map((s: any) => ({
            expenseId: expense.id,
            userId: s.userId,
            amountOwed: s.amountOwed || 0,
            percentage: s.percentage,
            shares: s.shares
          })),
        });
      }

      console.log(`[Scheduler] Created Expense ${expense.id}`);

      // 5. Update Recurring Schedule
      const nextDate = calculateNextRunDate(new Date(re.nextRunDate), re.frequency);
      await tx.recurringExpense.update({
        where: { id: re.id },
        data: {
          lastRunDate: new Date(),
          nextRunDate: nextDate,
        },
      });

      // 6. Async Post-Processing (Activity & Notify)
      // Since specific notification logic is outside transaction, we can fire off a promise or do it here if safe.
      // We'll log activity for the group/creator.

      // Activity
      await logActivity({
        userId: re.createdById,
        type: ActivityType.EXPENSE_ADDED,
        targetId: expense.id,
        groupId: re.groupId || undefined,
        data: {
          title: expense.title,
          amount: Number(expense.totalAmount),
          recurring: true
        },
      });

      // Notify Participants (Except Creator)
      for (const uid of participantIds) {
        if (uid !== re.createdById) {
          await sendNotification(
            uid,
            "Recurring Expense Added",
            `${re.creator.name} (Auto) added pending expense: ${expense.title}`,
            expense.id
          );
        }
      }
    });

  } catch (error) {
    console.error(`[Scheduler] Failed to process ${re.id}:`, error);
  }
}

function calculateNextRunDate(current: Date, freq: RecurringFrequency): Date {
  const next = new Date(current);
  switch (freq) {
    case RecurringFrequency.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case RecurringFrequency.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case RecurringFrequency.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}
