import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { RecurringFrequency, SplitType } from "@prisma/client";

export function initScheduler() {
  console.log("Initializing Recurring Expense Scheduler...");

  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    console.log(`[Scheduler] Checking for recurring expenses at ${new Date().toISOString()}`);
    await processRecurringExpenses();
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
    });

    console.log(`[Scheduler] Found ${dueExpenses.length} due recurring expenses.`);

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

    // 1. Create the new Expense
    // We need to construct payers, participants, and splits
    // Assuming creator pays full amount for recurring (simplification for MVP)
    // Or we should store 'payerId' in recurring model? 
    // Usually recurring expenses are paid by creator (e.g. Netflix subscription).

    const participantIds = re.participants as string[];
    const splitsData = re.splits as any[];

    // Create configured splits
    // Note: splitsData should be array of { userId, amountOwed, percentage, shares }

    // Create the expense transactionally
    await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          title: re.title,
          description: re.description, // Link to recurring? "Recurring: Netflix"
          // amount: removed, using totalAmount
          totalAmount: re.amount, // Schema uses totalAmount
          category: re.category,
          currency: "INR",
          splitType: re.splitType as SplitType,
          groupId: re.groupId,
          createdById: re.createdById,
          expenseDate: new Date(), // Now

          // Creators/Payers
          payers: {
            create: {
              userId: re.createdById,
              amountPaid: re.amount,
            },
          },

          // Participants
          participants: {
            createMany: {
              data: participantIds.map((id) => ({ userId: id })),
            },
          },

          // Splits
          splits: (re.splitType === "EQUAL") ? {
            createMany: {
              data: participantIds.map((uid: string) => ({
                userId: uid,
                amountOwed: Number(re.amount) / participantIds.length,
              }))
            }
          } : (splitsData ? {
            createMany: {
              data: splitsData.map((s: any) => ({
                userId: s.userId,
                amountOwed: s.amountOwed,
                percentage: s.percentage,
                shares: s.shares
              }))
            }
          } : undefined)
        },
      });

      console.log(`[Scheduler] Created Expense ${expense.id} from Recurring ${re.id}`);

      // 2. Update nextRunDate
      const nextDate = calculateNextRunDate(new Date(re.nextRunDate), re.frequency);

      await tx.recurringExpense.update({
        where: { id: re.id },
        data: {
          lastRunDate: new Date(),
          nextRunDate: nextDate,
        }
      });

      console.log(`[Scheduler] Updated Recurring ${re.id} next run to ${nextDate.toISOString()}`);
    });

  } catch (error) {
    console.error(`[Scheduler] Failed to process ${re.id}:`, error);
  }
}

function calculateNextRunDate(current: Date, freq: RecurringFrequency): Date {
  const next = new Date(current);
  switch (freq) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}
