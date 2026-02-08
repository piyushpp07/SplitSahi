/**
 * Min-Cash-Flow (Debt Simplification) Algorithm
 * Reduces the number of transactions needed to settle debts.
 * e.g. If A owes B $10 and B owes C $10 → A pays C $10.
 */

export interface NetBalance {
  userId: string;
  net: number; // positive = is owed, negative = owes
}

export interface SimplifiedTransaction {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

/**
 * Compute net balance per user from (paid - owed).
 * Then use min-cash-flow to produce minimal transactions.
 */
export function simplifyDebts(balances: NetBalance[]): SimplifiedTransaction[] {
  const netMap = new Map<string, number>();
  for (const b of balances) {
    const current = netMap.get(b.userId) ?? 0;
    netMap.set(b.userId, current + b.net);
  }

  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, net] of netMap) {
    if (Math.abs(net) < 0.01) continue; // ignore rounding
    if (net > 0) creditors.push({ userId, amount: net });
    if (net < 0) debtors.push({ userId, amount: -net });
  }

  const transactions: SimplifiedTransaction[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amount = Math.min(d.amount, c.amount);
    if (amount < 0.01) {
      if (d.amount <= c.amount) i++;
      else j++;
      continue;
    }
    transactions.push({
      fromUserId: d.userId,
      toUserId: c.userId,
      amount: Math.round(amount * 100) / 100,
    });
    d.amount -= amount;
    c.amount -= amount;
    if (d.amount < 0.01) i++;
    if (c.amount < 0.01) j++;
  }

  return transactions;
}

/**
 * For a single user: compute "total you owe" and "total you are owed"
 * from net balances (only involving this user with others).
 */
export function userSummary(
  userId: string,
  balances: NetBalance[]
): { youOwe: number; youAreOwed: number } {
  let youOwe = 0;
  let youAreOwed = 0;
  for (const b of balances) {
    if (b.userId === userId) {
      if (b.net < 0) youOwe += -b.net;
      else youAreOwed += b.net;
    }
  }
  return { youOwe, youAreOwed };
}
