import { prisma } from "../lib/prisma.js";

export async function getUserSpendingAnalytics(userId: string) {
  // Get all expense splits for this user
  // We only care about what the user OWES (their share of the expense)
  const splits = await prisma.expenseSplit.findMany({
    where: { userId },
    include: {
      expense: {
        select: {
          category: true,
          expenseDate: true,
          title: true, // Maybe for detailed view later
        },
      },
    },
    orderBy: {
      expense: {
        expenseDate: "desc",
      },
    },
  });

  // 1. By Category (Pie Chart)
  const categoryTotals: Record<string, number> = {};

  // 2. By Month (Line/Bar Chart) - Last 6 months
  const monthlyTotals: Record<string, number> = {};

  // 3. By Group (New feature)
  const groupTotals: Record<string, { name: string; amount: number }> = {};

  // Initialize last 6 months with 0
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    monthlyTotals[key] = 0;
  }

  const splitsExtended = await prisma.expenseSplit.findMany({
    where: { userId },
    include: {
      expense: {
        include: {
          group: { select: { id: true, name: true } }
        }
      }
    }
  });

  for (const split of splitsExtended) {
    const amount = Number(split.amountOwed);

    // Category
    const cat = split.expense.category || "Other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;

    // Monthly
    const date = new Date(split.expense.expenseDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyTotals[key] !== undefined) {
      monthlyTotals[key] += amount;
    }

    // Group
    if (split.expense.groupId && split.expense.group) {
      const gid = split.expense.groupId;
      if (!groupTotals[gid]) groupTotals[gid] = { name: split.expense.group.name, amount: 0 };
      groupTotals[gid].amount += amount;
    } else {
      const key = "Individual";
      if (!groupTotals[key]) groupTotals[key] = { name: "Non-Group", amount: 0 };
      groupTotals[key].amount += amount;
    }
  }

  const categoryData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const sortedMonthlyData = Object.keys(monthlyTotals).sort().map(key => ({
    label: new Date(key + "-01").toLocaleString('default', { month: 'short' }),
    value: monthlyTotals[key],
    fullDate: key
  }));

  const groupData = Object.entries(groupTotals)
    .map(([id, info]) => ({ id, name: info.name, value: info.amount }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    categoryData,
    monthlyData: sortedMonthlyData,
    groupData,
    totalSpent: splitsExtended.reduce((acc, curr) => acc + Number(curr.amountOwed), 0),
  };
}
