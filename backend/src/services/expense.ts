import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { toDecimal } from "../lib/utils.js";
import { suggestCategory } from "./smartCategories.js";
import { logActivity, sendNotification, ActivityType } from "./activity.js";
import { Decimal } from "@prisma/client/runtime/library";

export interface CreateExpenseDTO {
    groupId?: string | null;
    title: string;
    description?: string;
    category?: string;
    emoji?: string;
    totalAmount: number;
    currency?: string;
    imageUrl?: string;
    splitType: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARE";
    participantIds: string[];
    payers: { userId: string; amountPaid: number }[];
    splits?: any[];
    frequency?: "DAILY" | "WEEKLY" | "MONTHLY";
    date?: string;
}

export class ExpenseService {
    static async getExpenses(userId: string, groupId?: string) {
        return prisma.expense.findMany({
            where: {
                ...(groupId ? { groupId } : {}),
                OR: [
                    { participants: { some: { userId } } },
                    { groupId: groupId ? undefined : { not: null }, group: { members: { some: { userId } } } },
                ],
            },
            include: {
                creator: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } },
                payers: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } } } },
                splits: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } } } },
                participants: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } } } },
                group: groupId ? undefined : { select: { id: true, name: true, emoji: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
    }

    static async getExpenseById(expenseId: string, userId: string) {
        const expense = await prisma.expense.findFirst({
            where: {
                id: expenseId,
                OR: [
                    { participants: { some: { userId } } },
                    { group: { members: { some: { userId } } } },
                ],
            },
            include: {
                creator: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } },
                payers: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } } } },
                splits: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } } } },
                participants: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } } } },
                group: { select: { id: true, name: true, emoji: true } },
            },
        });
        if (!expense) throw new AppError(404, "Expense not found", "NOT_FOUND");
        return expense;
    }

    static async createExpense(userId: string, data: CreateExpenseDTO) {
        const {
            groupId,
            title,
            description,
            category,
            emoji,
            totalAmount,
            currency = "INR",
            imageUrl,
            splitType,
            participantIds,
            payers,
            splits,
            frequency,
            date,
        } = data;

        // Validation
        const totalPaid = payers.reduce((s, p) => s + Number(p.amountPaid), 0);
        if (Math.abs(totalPaid - Number(totalAmount)) > 0.02) {
            throw new AppError(400, "Sum of payers must equal total amount", "VALIDATION_ERROR");
        }

        const participants = Array.from(new Set(participantIds));
        if (!participants.includes(userId)) participants.push(userId);

        const categoryFinal = category?.trim() || suggestCategory(title, description);

        if (groupId) {
            const membership = await prisma.groupMember.findFirst({
                where: { groupId, userId }
            });
            if (!membership) throw new AppError(403, "Not a member of this group", "FORBIDDEN");
        }

        const expense = await prisma.$transaction(async (tx) => {
            const exp = await tx.expense.create({
                data: {
                    groupId: groupId || null,
                    title,
                    description: description || null,
                    category: categoryFinal,
                    emoji: emoji || null,
                    totalAmount: toDecimal(totalAmount),
                    currency,
                    imageUrl: imageUrl || null,
                    splitType,
                    createdById: userId,
                    expenseDate: date ? new Date(date) : new Date(),
                },
            });

            await tx.expenseParticipant.createMany({
                data: participants.map((uid) => ({ expenseId: exp.id, userId: uid })),
            });

            await tx.expensePayer.createMany({
                data: payers.map((p) => ({
                    expenseId: exp.id,
                    userId: p.userId,
                    amountPaid: toDecimal(p.amountPaid),
                })),
            });

            const splitData: any[] = [];
            const total = Number(totalAmount);

            if (splitType === "EQUAL") {
                const each = total / participants.length;
                participants.forEach(uid => splitData.push({ expenseId: exp.id, userId: uid, amountOwed: toDecimal(each) }));
            } else if (splitType === "EXACT" && Array.isArray(splits)) {
                splits.forEach(s => splitData.push({ expenseId: exp.id, userId: s.userId, amountOwed: toDecimal(s.amountOwed) }));
            } else if (splitType === "PERCENTAGE" && Array.isArray(splits)) {
                splits.forEach(s => splitData.push({
                    expenseId: exp.id,
                    userId: s.userId,
                    amountOwed: toDecimal((total * Number(s.percentage)) / 100),
                    percentage: toDecimal(s.percentage),
                }));
            } else if (splitType === "SHARE" && Array.isArray(splits)) {
                const totalShares = splits.reduce((sum, s) => sum + Number(s.shares || 0), 0);
                splits.forEach(s => splitData.push({
                    expenseId: exp.id,
                    userId: s.userId,
                    amountOwed: toDecimal((total * Number(s.shares)) / totalShares),
                    shares: Number(s.shares),
                }));
            }

            await tx.expenseSplit.createMany({ data: splitData });

            if (frequency) {
                let nextDate = new Date();
                if (frequency === "DAILY") nextDate.setDate(nextDate.getDate() + 1);
                if (frequency === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7);
                if (frequency === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1);

                await tx.recurringExpense.create({
                    data: {
                        title,
                        description: description || null,
                        amount: toDecimal(totalAmount),
                        category: categoryFinal,
                        frequency,
                        nextRunDate: nextDate,
                        groupId: groupId || null,
                        createdById: userId,
                        splitType,
                        participants,
                        splits: splits || [],
                    },
                });
            }

            return exp;
        });

        const enriched = await this.getExpenseById(expense.id, userId);

        // Background notifications
        this.notifyParticipants(userId, enriched, participants, title, totalAmount, groupId);

        return enriched;
    }

    private static async notifyParticipants(userId: string, expense: any, participants: string[], title: string, amount: number, groupId?: string | null) {
        try {
            const activity = await logActivity({
                userId,
                type: ActivityType.EXPENSE_ADDED,
                targetId: expense.id,
                groupId: groupId || undefined,
                data: { title, amount },
            });

            const otherParticipants = participants.filter(id => id !== userId);
            for (const pId of otherParticipants) {
                await sendNotification(
                    pId,
                    "New Expense",
                    `${expense.creator.name} added "${title}" (\u20B9${amount})`,
                    activity?.id
                );
            }
        } catch (err) {
            console.error("[ExpenseService] Notification error:", err);
        }
    }

    static async deleteExpense(expenseId: string, userId: string) {
        const expense = await prisma.expense.findUnique({
            where: { id: expenseId },
            include: { group: { include: { members: true } } },
        });
        if (!expense) throw new AppError(404, "Expense not found", "NOT_FOUND");

        const isCreator = expense.createdById === userId;
        const isAdmin = expense.group?.members.some((m) => m.userId === userId && m.role === "ADMIN");

        if (!isCreator && !isAdmin) throw new AppError(403, "Not authorized", "FORBIDDEN");

        return prisma.expense.delete({ where: { id: expenseId } });
    }
}
