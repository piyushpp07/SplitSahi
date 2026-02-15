import { prisma } from "../lib/prisma.js";
import { Decimal } from "@prisma/client/runtime/library";
import { simplifyNetBalances, type NetBalance, type SimplifiedTransaction } from "./debtSimplification.js";


import { convertCurrency } from "./currency.js";

function toNum(d: Decimal | number): number {
  if (typeof d === "number") return d;
  return Number(d);
}

/**
 * Core logic: For each expense, figure out who paid and who owes.
 * Net balance = (what I paid - what I owe).
 * Positive = I am owed. Negative = I owe.
 * 
 * We also compute pairwise debts so we can simplify.
 */
export async function getNetBalancesForUser(userId: string, groupId?: string | null): Promise<NetBalance[]> {
  // We need to compute balances for ALL users involved, not just the requesting user
  const netMap = new Map<string, number>();

  // Fetch user's preferred currency
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currency: true },
  });
  const userCurrency = user?.currency || "INR";
  console.log(`[Balance] Calculating balances for ${userId} in ${userCurrency}`);

  // 1) Get all relevant expenses
  // We need to fetch expenses where the user is involved EITHER as a payer OR as a participant
  const expenses = await prisma.expense.findMany({
    where: groupId
      ? { groupId }
      : {
        OR: [
          { payers: { some: { userId } } },      // User paid for something
          { splits: { some: { userId } } },      // User owes something
          { createdById: userId }                // User created it (just to be safe, though payers/splits covers debt)
        ],
      },
    include: {
      payers: true,
      splits: true,
    },
  });

  for (const exp of expenses) {
    const currency = exp.currency || "INR";

    // For each expense, compute:
    // - what each user paid
    // - what each user owes (from splits)
    // Net for this expense = paid - owed

    for (const payer of exp.payers) {
      const paid = toNum(payer.amountPaid);
      const convertedPaid = await convertCurrency(paid, currency, userCurrency);

      const current = netMap.get(payer.userId) ?? 0;
      netMap.set(payer.userId, current + convertedPaid);
      console.log(`[Balance] Expense Payer: ${paid} ${currency} -> ${convertedPaid} ${userCurrency}`);
    }

    for (const split of exp.splits) {
      const owed = toNum(split.amountOwed);
      const convertedOwed = await convertCurrency(owed, currency, userCurrency);

      const current = netMap.get(split.userId) ?? 0;
      netMap.set(split.userId, current - convertedOwed);
    }
  }

  // 2) Settlements: fromUser pays toUser (reduces fromUser's debt, increases toUser's receivable)
  const settlements = await prisma.settlement.findMany({
    where: {
      status: "COMPLETED", // Only count completed settlements
      ...(groupId
        ? { groupId }
        : {
          OR: [
            { fromUserId: userId },
            { toUserId: userId }
          ]
        }),
    },
  });

  for (const s of settlements) {
    const amt = toNum(s.amount);
    const currency = s.currency || "INR";
    const convertedAmt = await convertCurrency(amt, currency, userCurrency);

    // fromUser gave money → they paid, so add to their net (reducing their negative balance)
    netMap.set(s.fromUserId, (netMap.get(s.fromUserId) ?? 0) + convertedAmt);
    // toUser received money → they now owe less/gave value, so subtract from their net (reducing their positive balance)
    netMap.set(s.toUserId, (netMap.get(s.toUserId) ?? 0) - convertedAmt);
  }

  const result: NetBalance[] = [];
  for (const [uid, net] of netMap) {
    // Floating point precision check handling
    if (Math.abs(net) >= 0.01) {
      result.push({ userId: uid, amount: net });
    }
  }
  return result;
}

export async function getSimplifiedTransactions(
  userId: string,
  groupId?: string | null
): Promise<SimplifiedTransaction[]> {
  const balances = await getNetBalancesForUser(userId, groupId);

  // Convert NetBalance[] to Record<string, number>
  const balanceMap: Record<string, number> = {};
  for (const b of balances) {
    balanceMap[b.userId] = b.amount;
  }

  // We use debt simplification regardless of group/global
  const allSimplified = simplifyNetBalances(balanceMap);

  // Filter for user
  return allSimplified.filter(t => t.from === userId || t.to === userId);
}

/**
 * Dashboard: total you owe, total you are owed.
 */
export async function getDashboardTotals(userId: string, groupId?: string | null): Promise<{
  youOwe: number;
  youAreOwed: number;
  simplifiedTransactions: SimplifiedTransaction[];
}> {
  // Pass the userId to ensure we only get relevant transactions
  const simplifiedTransactions = await getSimplifiedTransactions(userId, groupId);

  let youOwe = 0;
  let youAreOwed = 0;

  for (const t of simplifiedTransactions) {
    if (t.from === userId) {
      youOwe += t.amount;
    }
    if (t.to === userId) {
      youAreOwed += t.amount;
    }
  }

  return {
    youOwe,
    youAreOwed,
    simplifiedTransactions,
  };
}
