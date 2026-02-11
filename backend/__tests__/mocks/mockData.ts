// Mock Data for Testing
// This file contains reusable mock objects for tests

export const mockUsers = {
    user1: {
        id: 'user-1',
        username: 'user1',
        email: 'user1@example.com',
        emailVerified: true,
        name: 'User One',
        phone: '+1234567890',
        phoneVerified: true,
        passwordHash: 'hashedpass1', // Schema uses passwordHash
        password: 'hashedpass1', // Keep for compatibility if tests use it as input
        clerkId: null,
        oauthProvider: null,
        oauthId: null,
        upiId: 'user1@upi',
        avatarUrl: null,
        emoji: '😀',
        currency: 'INR',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    user2: {
        id: 'user-2',
        username: 'user2',
        email: 'user2@example.com',
        emailVerified: true,
        name: 'User Two',
        phone: '+9876543210',
        phoneVerified: true,
        passwordHash: 'hashedpass2',
        password: 'hashedpass2',
        clerkId: null,
        oauthProvider: null,
        oauthId: null,
        upiId: 'user2@upi',
        avatarUrl: null,
        emoji: '😎',
        currency: 'INR',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
    },
    user3: {
        id: 'user-3',
        username: 'user3',
        email: 'user3@example.com',
        emailVerified: true,
        name: 'User Three',
        phone: '+5555555555',
        phoneVerified: true,
        passwordHash: 'hashedpass3',
        password: 'hashedpass3',
        clerkId: null,
        oauthProvider: null,
        oauthId: null,
        upiId: 'user3@upi',
        avatarUrl: null,
        emoji: '🤠',
        currency: 'INR',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
    },
};

export const mockGroups = {
    group1: {
        id: 'group-1',
        name: 'Trip to Goa',
        description: 'Beach vacation 2024',
        imageUrl: null,
        emoji: '🏖️',
        currency: 'INR',
        inviteCode: 'GOATRIP',
        createdById: mockUsers.user1.id,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    group2: {
        id: 'group-2',
        name: 'Roommates',
        description: 'Monthly expenses',
        imageUrl: null,
        emoji: '🏠',
        currency: 'INR',
        inviteCode: 'ROOMIES',
        createdById: mockUsers.user2.id,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
    },
};

export const mockGroupMembers = {
    member1: {
        id: 'member-1',
        userId: mockUsers.user1.id,
        groupId: mockGroups.group1.id,
        role: 'ADMIN' as const,
        joinedAt: new Date('2024-01-01'),
        user: mockUsers.user1,
    },
    member2: {
        id: 'member-2',
        userId: mockUsers.user2.id,
        groupId: mockGroups.group1.id,
        role: 'MEMBER' as const,
        joinedAt: new Date('2024-01-02'),
        user: mockUsers.user2,
    },
    member3: {
        id: 'member-3',
        userId: mockUsers.user3.id,
        groupId: mockGroups.group1.id,
        role: 'MEMBER' as const,
        joinedAt: new Date('2024-01-03'),
        user: mockUsers.user3,
    },
};

export const mockExpenses = {
    expense1: {
        id: 'expense-1',
        title: 'Dinner at Restaurant',
        description: null,
        totalAmount: 900,
        category: 'Food',
        emoji: '🍔',
        imageUrl: null,
        splitType: 'EQUAL' as const,
        groupId: mockGroups.group1.id,
        createdById: mockUsers.user1.id,
        expenseDate: new Date('2024-01-05'),
        currency: 'INR',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
        payers: [
            {
                id: 'payer-1',
                userId: mockUsers.user1.id,
                expenseId: 'expense-1',
                amountPaid: 900,
            },
        ],
        splits: [
            {
                id: 'split-1',
                userId: mockUsers.user1.id,
                expenseId: 'expense-1',
                amountOwed: 300,
                percentage: null,
                shares: null,
            },
            {
                id: 'split-2',
                userId: mockUsers.user2.id,
                expenseId: 'expense-1',
                amountOwed: 300,
                percentage: null,
                shares: null,
            },
            {
                id: 'split-3',
                userId: mockUsers.user3.id,
                expenseId: 'expense-1',
                amountOwed: 300,
                percentage: null,
                shares: null,
            },
        ],
    },
    expense2: {
        id: 'expense-2',
        title: 'Hotel Booking',
        description: null,
        totalAmount: 6000,
        category: 'Accommodation',
        emoji: '🏨',
        imageUrl: null,
        splitType: 'EQUAL' as const,
        groupId: mockGroups.group1.id,
        createdById: mockUsers.user2.id,
        expenseDate: new Date('2024-01-10'),
        currency: 'INR',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        payers: [
            {
                id: 'payer-2',
                userId: mockUsers.user2.id,
                expenseId: 'expense-2',
                amountPaid: 6000,
            },
        ],
        splits: [
            {
                id: 'split-4',
                userId: mockUsers.user1.id,
                expenseId: 'expense-2',
                amountOwed: 2000,
                percentage: null,
                shares: null,
            },
            {
                id: 'split-5',
                userId: mockUsers.user2.id,
                expenseId: 'expense-2',
                amountOwed: 2000,
                percentage: null,
                shares: null,
            },
            {
                id: 'split-6',
                userId: mockUsers.user3.id,
                expenseId: 'expense-2',
                amountOwed: 2000,
                percentage: null,
                shares: null,
            },
        ],
    },
};

export const mockSettlements = {
    settlement1: {
        id: 'settlement-1',
        fromUserId: mockUsers.user2.id,
        toUserId: mockUsers.user1.id,
        groupId: mockGroups.group1.id,
        amount: 500,
        status: 'COMPLETED' as const,
        currency: 'INR',
        notes: 'Partial payment',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
    },
    settlement2: {
        id: 'settlement-2',
        fromUserId: mockUsers.user3.id,
        toUserId: mockUsers.user1.id,
        groupId: mockGroups.group1.id,
        amount: 300,
        status: 'PENDING' as const,
        currency: 'INR',
        notes: null,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
    },
};

export const mockFriendships = {
    friendship1: {
        id: 'friendship-1',
        user1Id: mockUsers.user1.id,
        user2Id: mockUsers.user2.id,
        status: 'ACCEPTED' as const,
        requestedById: mockUsers.user1.id,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
};

// Helper function to create a mock token
export const createMockToken = (userId: string): string => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ userId, email: 'test@example.com' }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

// Helper function to create full group with members
export const createMockGroupWithMembers = (groupId: string = mockGroups.group1.id) => {
    return {
        ...mockGroups.group1,
        id: groupId,
        members: Object.values(mockGroupMembers).filter(m => m.groupId === groupId),
        _count: {
            members: Object.values(mockGroupMembers).filter(m => m.groupId === groupId).length,
            expenses: Object.values(mockExpenses).filter((e: any) => e.groupId === groupId).length,
        },
    };
};

// Helper function to create expense with payers and splits
export const createMockExpenseWithDetails = (expenseId: string = mockExpenses.expense1.id) => {
    const expense = Object.values(mockExpenses).find((e: any) => e.id === expenseId) || mockExpenses.expense1;
    return {
        ...expense,
        payers: expense.payers.map(p => ({
            ...p,
            user: Object.values(mockUsers).find(u => u.id === p.userId),
        })),
        splits: expense.splits.map(s => ({
            ...s,
            user: Object.values(mockUsers).find(u => u.id === s.userId),
        })),
        participants: expense.splits.map(s => ({
            userId: s.userId,
            user: Object.values(mockUsers).find(u => u.id === s.userId),
        })),
    };
};

export const mockActivities = [
    {
        id: 'activity-1',
        type: 'EXPENSE_ADDED' as const,
        userId: mockUsers.user1.id,
        targetId: mockExpenses.expense1.id,
        data: {
            title: mockExpenses.expense1.title,
            amount: mockExpenses.expense1.totalAmount,
            category: mockExpenses.expense1.category,
        },
        createdAt: new Date('2024-01-05'),
        user: mockUsers.user1,
        group: mockGroups.group1,
    },
    {
        id: 'activity-2',
        type: 'SETTLEMENT_MADE' as const,
        userId: mockUsers.user2.id,
        targetId: mockSettlements.settlement1.id,
        data: {
            amount: mockSettlements.settlement1.amount,
            toUserId: mockSettlements.settlement1.toUserId,
        },
        createdAt: new Date('2024-01-15'),
        user: mockUsers.user2,
        group: mockGroups.group1,
    },
];

// Reset function for tests
export const resetMocks = () => {
    // Can be used to reset any stateful mocks
    jest.clearAllMocks();
};
