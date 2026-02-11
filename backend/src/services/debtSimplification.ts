import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

interface Transaction {
  from: string;
  to: string;
  amount: number;
}

interface UserBalance {
  userId: string;
  amount: number; // Positive = owed money (creditor), Negative = owes money (debtor)
}

// Re-export expected types
export type SimplifiedTransaction = Transaction;

export interface NetBalance {
  userId: string;
  amount: number;
}

// Alias for compatibility
export const simplifyDebts = getSimplifiedDebts;

/**
 * Calculates the net balances for each user within a specific group,
 * considering expenses and settlements.
 * @param groupId The ID of the group.
 * @returns A record where keys are user IDs and values are their net balances.
 */
export async function calculateNetBalances(groupId: string): Promise<Record<string, number>> {
  const balances: Record<string, number> = {};

  // A. Add amounts paid for expenses (Creditor)
  // We need to look at ExpensePayer to see who actually paid.
  // And look at ExpenseSplit to see who owes.

  // Fetch all expenses in the group
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      payers: true,
      splits: true,
    },
  });

  for (const expense of expenses) {
    // Add to balance for payers (they are owed money)
    for (const payer of expense.payers) {
      balances[payer.userId] = (balances[payer.userId] || 0) + Number(payer.amountPaid);
    }
    // Subtract from balance for splitters (they owe money)
    for (const split of expense.splits) {
      balances[split.userId] = (balances[split.userId] || 0) - Number(split.amountOwed);
    }
  }

  // B. Incorporate Settlements (Payments made to settle recurring debts)
  // If User A paid User B 50 in a settlement, A's balance increases (debt paid off), B's balance decreases (debt collected).
  const settlements = await prisma.settlement.findMany({
    where: { groupId, status: "COMPLETED" }, // Only count completed settlements
  });

  for (const settlement of settlements) {
    // Extra safety: double check status if returned by mock or unexpected query result
    if (settlement.status !== "COMPLETED") continue;

    // Payer (fromUser) gains balance (paid off debt)
    balances[settlement.fromUserId] = (balances[settlement.fromUserId] || 0) + Number(settlement.amount);
    // Receiver (toUser) loses balance (collected debt)
    balances[settlement.toUserId] = (balances[settlement.toUserId] || 0) - Number(settlement.amount);
  }

  return balances;
}

/**
 * Pure function to simplify debts from a balance map.
 * Takes a map of user IDs to their net balances and returns a list of simplified transactions.
 * @param balances A record where keys are user IDs and values are their net balances.
 * @returns An array of simplified transactions.
 */
export function simplifyNetBalances(balances: Record<string, number>): Transaction[] {
  // 2. Separate into Debtors and Creditors
  const debtors: UserBalance[] = [];
  const creditors: UserBalance[] = [];

  for (const [userId, amount] of Object.entries(balances)) {
    // Use a small epsilon for float comparison to avoid tiny lingering decimals
    if (amount < -0.01) {
      debtors.push({ userId, amount });
    } else if (amount > 0.01) {
      creditors.push({ userId, amount });
    }
  }

  // 3. Greedy Matching Algorithm
  // Sort by magnitude (largest debt/credit first) to try and knock out big debts
  debtors.sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
  creditors.sort((a, b) => b.amount - a.amount); // Descending (most positive first)

  const transactions: Transaction[] = [];

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // The amount to settle is the minimum of what the debtor owes and what the creditor is owed.
    const amount = Math.min(creditor.amount, -debtor.amount);

    // Record transaction
    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Number(amount.toFixed(2)),
    });

    // Update balances
    creditor.amount -= amount;
    debtor.amount += amount;

    // If creditor is satisfied (close to 0), move to next creditor
    if (Math.abs(creditor.amount) < 0.01) {
      i++;
    }

    // If debtor is satisfied (close to 0), move to next debtor
    if (Math.abs(debtor.amount) < 0.01) {
      j++;
    }
  }

  return transactions;
}

/**
 * Calculates simplified debts for a group to minimize transaction count.
 * This function orchestrates the calculation of net balances and then simplifies them.
 * @param groupId The ID of the group.
 * @returns An array of simplified transactions for the group.
 */
export async function getSimplifiedDebts(groupId: string): Promise<Transaction[]> {
  // 1. Calculate Net Balances for each user in the group
  const balances = await calculateNetBalances(groupId);

  // 2. Simplify the calculated net balances
  return simplifyNetBalances(balances);
}
