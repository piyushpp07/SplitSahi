import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

// Define the shape of the data we're fetching
type SplitWithDetails = Prisma.ExpenseSplitGetPayload<{
  include: {
    expense: {
      include: {
        group: { select: { id: true, name: true } };
        participants: {
          include: { user: { select: { id: true, name: true, avatarUrl: true, emoji: true } } }
        };
      };
    };
  };
}>;

export async function getUserSpendingAnalytics(userId: string) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Fetch splits with more details
  const splits = await prisma.expenseSplit.findMany({
    where: { userId },
    include: {
      expense: {
        include: {
          group: { select: { id: true, name: true } },
          participants: {
            include: { user: { select: { id: true, name: true, avatarUrl: true, emoji: true } } }
          }
        }
      }
    },
    orderBy: { expense: { expenseDate: "asc" } }
  });

  const splitsExtended = splits as unknown as SplitWithDetails[];

  const categoryTotals: Record<string, number> = {};
  const monthlyTotals: Record<string, number> = {};
  const yearlyTotals: Record<string, number> = {};
  const groupTotals: Record<string, { name: string; amount: number }> = {};
  const friendTotals: Record<string, { name: string; avatarUrl?: string | null; emoji?: string | null; amount: number }> = {};
  const dailyTotals: Record<string, number> = {};

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyTotals[key] = 0;
  }

  // Initialize current year and previous year
  yearlyTotals[currentYear] = 0;
  yearlyTotals[currentYear - 1] = 0;

  // Initialize current month days
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let i = 1; i <= lastDay; i++) {
    const dayKey = String(i).padStart(2, '0');
    dailyTotals[dayKey] = 0;
  }

  for (const split of splitsExtended) {
    // Safety check
    if (!split.expense) continue;

    const amount = Number(split.amountOwed);
    const date = new Date(split.expense.expenseDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Year-wise
    if (yearlyTotals[year] !== undefined) {
      yearlyTotals[year] += amount;
    } else {
      yearlyTotals[year] = amount;
    }

    // Monthly Key
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    if (monthlyTotals[monthKey] !== undefined) {
      monthlyTotals[monthKey] += amount;
    }

    // Daily (only for current month)
    if (year === currentYear && month === currentMonth) {
      const dayKey = String(day).padStart(2, '0');
      if (dailyTotals[dayKey] !== undefined) dailyTotals[dayKey] += amount;
    }

    // Category
    const cat = split.expense.category || "Other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;

    // Group
    if (split.expense.groupId && split.expense.group) {
      const gid = split.expense.groupId;
      if (!groupTotals[gid]) groupTotals[gid] = { name: split.expense.group.name, amount: 0 };
      groupTotals[gid].amount += amount;
    }

    // Friend-wise (associated spending)
    for (const p of split.expense.participants) {
      // Don't count yourself
      if (p.userId !== userId) {
        if (!friendTotals[p.userId]) {
          friendTotals[p.userId] = {
            name: p.user.name,
            avatarUrl: p.user.avatarUrl,
            emoji: p.user.emoji,
            amount: 0
          };
        }
        friendTotals[p.userId].amount += amount;
      }
    }
  }

  // Transformations for frontend
  const categoryData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const monthlyData = Object.keys(monthlyTotals).sort().map(key => ({
    label: new Date(key + "-01").toLocaleString('default', { month: 'short' }),
    value: monthlyTotals[key],
    fullDate: key
  }));

  const yearlyData = Object.entries(yearlyTotals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => Number(a.label) - Number(b.label));

  const groupData = Object.entries(groupTotals)
    .map(([id, info]) => ({ id, name: info.name, value: info.amount }))
    .sort((a, b) => b.value - a.value);

  const friendData = Object.entries(friendTotals)
    .map(([id, info]) => ({
      id,
      name: info.name,
      avatarUrl: info.avatarUrl,
      emoji: info.emoji,
      value: info.amount
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const dailyData = Object.entries(dailyTotals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => Number(a.label) - Number(b.label));

  return {
    totalSpent: splitsExtended.reduce((acc: number, curr: any) => acc + Number(curr.amountOwed), 0),
    categoryData,
    monthlyData,
    yearlyData,
    groupData,
    friendData,
    dailyData,
    currentMonthTotal: dailyData.reduce((acc, curr) => acc + curr.value, 0),
  };
}
