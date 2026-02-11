import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

const mockPrismaClient = mockDeep<PrismaClient>();
jest.mock('../../src/lib/prisma', () => ({
    __esModule: true,
    prisma: mockPrismaClient,
}));

import request from 'supertest';
import express from 'express';
import { groupsRouter } from '../../src/routes/groups';
import jwt from 'jsonwebtoken';
import { authMiddleware, requireUser } from '../../src/middleware/auth';
import { errorHandler } from '../../src/middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/groups', authMiddleware, requireUser, groupsRouter);
app.use(errorHandler);

const createMockToken = (userId: string) => {
    return jwt.sign({ userId, email: 'test@example.com' }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

describe('Groups Routes', () => {
    const prismaMock = mockPrismaClient;

    const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        phone: '+1234567890',
        phoneVerified: true,
        passwordHash: 'hashedpass',
        clerkId: null,
        oauthProvider: null,
        oauthId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        upiId: null,
        avatarUrl: null,
        emoji: null,
        currency: 'INR',
    };

    const mockGroup = {
        id: 'group-123',
        name: 'Test Group',
        description: 'Test Description',
        imageUrl: null,
        emoji: '🧪',
        currency: 'INR',
        inviteCode: 'ABC123',
        createdById: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        prismaMock.user.findUnique.mockResolvedValue(mockUser);
    });

    describe('GET /api/groups', () => {
        it('should return all groups for authenticated user', async () => {
            const mockGroupsWithMembers = [{
                ...mockGroup,
                members: [
                    {
                        id: 'member-123',
                        userId: mockUser.id,
                        groupId: mockGroup.id,
                        role: 'ADMIN' as const,
                        joinedAt: new Date(),
                    },
                ],
                _count: {
                    members: 1,
                    expenses: 5,
                },
            }];

            prismaMock.group.findMany.mockResolvedValue(mockGroupsWithMembers as any);

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .get('/api/groups')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/groups');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/groups', () => {
        it('should create a new group', async () => {
            const newGroup = {
                name: 'New Group',
                description: 'New Description',
            };

            prismaMock.group.create.mockResolvedValue({
                ...mockGroup,
                ...newGroup,
            });

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .post('/api/groups')
                .set('Authorization', `Bearer ${token}`)
                .send(newGroup);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe(newGroup.name);
            expect(response.body.description).toBe(newGroup.description);
        });

        it('should return 400 with missing name', async () => {
            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .post('/api/groups')
                .set('Authorization', `Bearer ${token}`)
                .send({ description: 'No name provided' });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/groups/:id', () => {
        it('should return a specific group with members', async () => {
            const mockGroupDetails = {
                ...mockGroup,
                members: [
                    {
                        id: 'member-123',
                        userId: mockUser.id,
                        groupId: mockGroup.id,
                        role: 'ADMIN' as const,
                        joinedAt: new Date(),
                        user: mockUser,
                    },
                ],
                expenses: [],
                createdBy: mockUser,
            };

            prismaMock.group.findFirst.mockResolvedValue(mockGroupDetails as any);

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .get(`/api/groups/${mockGroup.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(mockGroup.id);
            expect(response.body.members).toBeDefined();
        });

        it('should return 404 for non-existent group', async () => {
            prismaMock.group.findFirst.mockResolvedValue(null);

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .get('/api/groups/non-existent-id')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /api/groups/:id', () => {
        it('should update a group (admin only)', async () => {
            const updatedData = {
                name: 'Updated Group Name',
                description: 'Updated Description',
            };

            prismaMock.groupMember.findFirst.mockResolvedValue({
                id: 'member-123',
                userId: mockUser.id,
                groupId: mockGroup.id,
                role: 'ADMIN' as const,
                joinedAt: new Date(),
            });

            prismaMock.group.update.mockResolvedValue({
                ...mockGroup,
                ...updatedData,
            });

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .patch(`/api/groups/${mockGroup.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe(updatedData.name);
        });

        it('should return 403 for non-admin users', async () => {
            prismaMock.groupMember.findFirst.mockResolvedValue(null);

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .patch(`/api/groups/${mockGroup.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Trying to update' });

            expect(response.status).toBe(403);
        });
    });

    describe('DELETE /api/groups/:id', () => {
        it('should delete a group (admin only)', async () => {
            prismaMock.groupMember.findFirst.mockResolvedValue({
                id: 'member-123',
                userId: mockUser.id,
                groupId: mockGroup.id,
                role: 'ADMIN' as const,
                joinedAt: new Date(),
            });

            prismaMock.group.delete.mockResolvedValue(mockGroup);

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .delete(`/api/groups/${mockGroup.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(204);
        });
    });

    describe('POST /api/groups/:id/join', () => {
        it('should join a group with valid invite code', async () => {
            const mockGroupWithMembers = { ...mockGroup, members: [] };
            prismaMock.group.findUnique.mockResolvedValue(mockGroupWithMembers as any);
            prismaMock.groupMember.findFirst.mockResolvedValue(null);
            prismaMock.groupMember.create.mockResolvedValue({
                id: 'new-member-123',
                userId: mockUser.id,
                groupId: mockGroup.id,
                role: 'MEMBER' as const,
                joinedAt: new Date(),
            });

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .post(`/api/groups/join`)
                .set('Authorization', `Bearer ${token}`)
                .send({ groupId: mockGroup.id });

            expect(response.status).toBe(200);
        });

        it('should return 400 with invalid invite code', async () => {
            prismaMock.group.findUnique.mockResolvedValue(null); // Group not found

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .post(`/api/groups/join`)
                .set('Authorization', `Bearer ${token}`)
                .send({ groupId: 'WRONG123' });

            expect(response.status).toBe(404);
        });

        it('should return 400 if already a member', async () => {
            const mockGroupWithMembers = {
                ...mockGroup,
                members: [{ userId: mockUser.id }] // User is member
            };
            prismaMock.group.findUnique.mockResolvedValue(mockGroupWithMembers as any);

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .post(`/api/groups/join`)
                .set('Authorization', `Bearer ${token}`)
                .send({ groupId: mockGroup.id });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/groups/:id/simplified-debts', () => {
        it('should return simplified debts for a group', async () => {
            const mockGroupDetails = {
                ...mockGroup,
                members: [
                    {
                        id: 'member-123',
                        userId: mockUser.id,
                        groupId: mockGroup.id,
                        role: 'ADMIN' as const,
                        joinedAt: new Date(),
                        user: mockUser,
                    },
                ],
            };

            prismaMock.group.findFirst.mockResolvedValue(mockGroupDetails as any);
            prismaMock.groupMember.findFirst.mockResolvedValue({ id: 'member-1' } as any);
            prismaMock.expense.findMany.mockResolvedValue([]);
            prismaMock.settlement.findMany.mockResolvedValue([]);
            prismaMock.user.findMany.mockResolvedValue([mockUser]);

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .get(`/api/groups/${mockGroup.id}/simplified-debts`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});
