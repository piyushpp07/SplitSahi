import { prisma } from "../lib/prisma.js";
import { Decimal } from "@prisma/client/runtime/library";
import { simplifyDebts, type NetBalance, type SimplifiedTransaction } from "./debtSimplification.js";

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

  // 1) Get all relevant expenses
  const expenses = await prisma.expense.findMany({
    where: groupId
      ? { groupId }
      : {
          OR: [
            { participants: { some: { userId } } },
            { group: { members: { some: { userId } } } },
          ],
        },
    include: {
      payers: true,
      splits: true,
      participants: true,
    },
  });

  for (const exp of expenses) {
    if (groupId && exp.groupId !== groupId) continue;

    // For each expense, compute:
    // - what each user paid
    // - what each user owes (from splits)
    // Net for this expense = paid - owed
    
    for (const payer of exp.payers) {
      const paid = toNum(payer.amountPaid);
      netMap.set(payer.userId, (netMap.get(payer.userId) ?? 0) + paid);
    }

    for (const split of exp.splits) {
      const owed = toNum(split.amountOwed);
      netMap.set(split.userId, (netMap.get(split.userId) ?? 0) - owed);
    }
  }

  // 2) Settlements: fromUser pays toUser (reduces fromUser's debt, increases toUser's receivable)
  const settlements = await prisma.settlement.findMany({
    where: {
      status: "COMPLETED",
      ...(groupId ? { groupId } : { OR: [{ fromUserId: userId }, { toUserId: userId }] }),
    },
  });

  for (const s of settlements) {
    const amt = toNum(s.amount);
    // fromUser gave money → they paid, so add to their net
    netMap.set(s.fromUserId, (netMap.get(s.fromUserId) ?? 0) + amt);
    // toUser received money → they now owe less, so subtract from their net
    netMap.set(s.toUserId, (netMap.get(s.toUserId) ?? 0) - amt);
  }

  const result: NetBalance[] = [];
  for (const [uid, net] of netMap) {
    if (Math.abs(net) >= 0.01) {
      result.push({ userId: uid, net });
    }
  }
  return result;
}

/**
 * Get simplified "who should pay whom" for a group or global.
 */
export async function getSimplifiedTransactions(
  _userId: string,
  groupId?: string | null
): Promise<SimplifiedTransaction[]> {
  const balances = await getNetBalancesForUser(_userId, groupId);
  return simplifyDebts(balances);
}

/**
 * Dashboard: total you owe, total you are owed.
 * Based on simplified transactions:
 * - youOwe = sum of amounts where you are the fromUser
 * - youAreOwed = sum of amounts where you are the toUser
 */
export async function getDashboardTotals(userId: string, groupId?: string | null): Promise<{
  youOwe: number;
  youAreOwed: number;
  simplifiedTransactions: SimplifiedTransaction[];
}> {
  const simplifiedTransactions = await getSimplifiedTransactions(userId, groupId);
  
  let youOwe = 0;
  let youAreOwed = 0;
  
  for (const t of simplifiedTransactions) {
    if (t.fromUserId === userId) {
      youOwe += t.amount;
    }
    if (t.toUserId === userId) {
      youAreOwed += t.amount;
    }
  }

  return {
    youOwe,
    youAreOwed,
    simplifiedTransactions,
  };
}
