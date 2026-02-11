import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

const mockPrismaClient = mockDeep<PrismaClient>();
jest.mock('../../src/lib/prisma', () => ({
    __esModule: true,
    prisma: mockPrismaClient,
}));

import { simplifyNetBalances, getSimplifiedDebts } from '../../src/services/debtSimplification';

describe('Debt Simplification Service', () => {
    const prismaMock = mockPrismaClient;

    describe('simplifyNetBalances', () => {
        it('should return empty array for zero balances', () => {
            const balances: Record<string, number> = {
                'user1': 0,
                'user2': 0,
            };

            const result = simplifyNetBalances(balances);

            expect(result).toEqual([]);
        });

        it('should handle simple two-person debt', () => {
            const balances: Record<string, number> = {
                'userA': -100,  // owes 100
                'userB': 100,   // is owed 100
            };

            const result = simplifyNetBalances(balances);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                from: 'userA',
                to: 'userB',
                amount: 100,
            });
        });

        it('should simplify complex multi-person debts', () => {
            const balances: Record<string, number> = {
                'userA': 200,
                'userB': -150,
                'userC': -50,
            };

            const result = simplifyNetBalances(balances);

            expect(result).toHaveLength(2);

            const totalFrom = result.reduce((sum, t) => sum + t.amount, 0);
            const totalTo = result.reduce((sum, t) => sum + t.amount, 0);
            expect(totalFrom).toBe(totalTo);
            expect(totalFrom).toBe(200);
        });

        it('should handle circular debts efficiently', () => {
            const balances: Record<string, number> = {
                'user1': 50,
                'user2': -30,
                'user3': -20,
            };

            const result = simplifyNetBalances(balances);

            expect(result.length).toBeLessThanOrEqual(2);

            const netBalances: Record<string, number> = {};
            result.forEach(t => {
                netBalances[t.from] = (netBalances[t.from] || 0) - t.amount;
                netBalances[t.to] = (netBalances[t.to] || 0) + t.amount;
            });

            Object.keys(balances).forEach(userId => {
                expect(Math.abs((netBalances[userId] || 0) - balances[userId])).toBeLessThan(0.01);
            });
        });

        it('should ignore very small balances', () => {
            const balances: Record<string, number> = {
                'user1': 0.005,  // Less than epsilon (0.01)
                'user2': -0.005,
            };

            const result = simplifyNetBalances(balances);

            expect(result).toEqual([]);
        });

        it('should handle rounding correctly', () => {
            const balances: Record<string, number> = {
                'user1': 33.33,
                'user2': -33.33,
            };

            const result = simplifyNetBalances(balances);

            expect(result).toHaveLength(1);
            expect(result[0].amount).toBe(33.33);
        });
    });

    describe('getSimplifiedDebts', () => {
        it('should simplify group expenses and settlements', async () => {
            const groupId = 'group-123';

            prismaMock.expense.findMany.mockResolvedValue([
                {
                    id: 'exp-1',
                    title: 'Dinner',
                    totalAmount: 300,
                    groupId,
                    payers: [
                        { userId: 'user1', amountPaid: 300, id: 'payer-1', expenseId: 'exp-1' },
                    ],
                    splits: [
                        { userId: 'user1', amountOwed: 100, id: 'split-1', expenseId: 'exp-1' },
                        { userId: 'user2', amountOwed: 100, id: 'split-2', expenseId: 'exp-1' },
                        { userId: 'user3', amountOwed: 100, id: 'split-3', expenseId: 'exp-1' },
                    ],
                } as any,
            ]);

            prismaMock.settlement.findMany.mockResolvedValue([]);

            const result = await getSimplifiedDebts(groupId);

            expect(result).toHaveLength(2);
            const totalAmount = result.reduce((sum, t) => sum + t.amount, 0);
            expect(totalAmount).toBe(200);
        });

        it('should incorporate completed settlements', async () => {
            const groupId = 'group-123';

            prismaMock.expense.findMany.mockResolvedValue([
                {
                    id: 'exp-1',
                    title: 'Dinner',
                    totalAmount: 200,
                    groupId,
                    payers: [
                        { userId: 'user1', amountPaid: 200, id: 'payer-1', expenseId: 'exp-1' },
                    ],
                    splits: [
                        { userId: 'user1', amountOwed: 100, id: 'split-1', expenseId: 'exp-1' },
                        { userId: 'user2', amountOwed: 100, id: 'split-2', expenseId: 'exp-1' },
                    ],
                } as any,
            ]);

            prismaMock.settlement.findMany.mockResolvedValue([
                {
                    id: 'settlement-1',
                    fromUserId: 'user2',
                    toUserId: 'user1',
                    amount: 50,
                    status: 'COMPLETED',
                    groupId,
                } as any,
            ]);

            const result = await getSimplifiedDebts(groupId);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                from: 'user2',
                to: 'user1',
                amount: 50,
            });
        });

        it('should ignore pending settlements', async () => {
            const groupId = 'group-123';

            prismaMock.expense.findMany.mockResolvedValue([]);

            prismaMock.settlement.findMany.mockResolvedValue([
                {
                    id: 'settlement-1',
                    fromUserId: 'user2',
                    toUserId: 'user1',
                    amount: 100,
                    status: 'PENDING',
                    groupId,
                } as any,
            ]);

            const result = await getSimplifiedDebts(groupId);

            expect(result).toEqual([]);
        });
    });
});
