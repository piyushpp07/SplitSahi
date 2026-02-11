import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

const mockPrismaClient = mockDeep<PrismaClient>();
jest.mock('../../src/lib/prisma', () => ({
    __esModule: true,
    prisma: mockPrismaClient,
}));

import request from 'supertest';
import express from 'express';
import { usersRouter } from '../../src/routes/users';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../../src/middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);
app.use(errorHandler);

const createMockToken = (userId: string) => {
    return jwt.sign({ userId, email: 'test@example.com' }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

describe('Users Routes', () => {
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
        upiId: 'test@upi',
        avatarUrl: null,
        emoji: null,
        currency: 'INR',
    };

    beforeEach(() => {
        prismaMock.user.findUnique.mockResolvedValue(mockUser);
    });

    describe('GET /api/users/me', () => {
        it('should return current user data', async () => {
            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(mockUser.id);
            expect(response.body.email).toBe(mockUser.email);
            expect(response.body).not.toHaveProperty('password');
        });

        it('should return 401 without authorization', async () => {
            const response = await request(app)
                .get('/api/users/me');

            expect(response.status).toBe(401);
        });

        it('should return 404 if user not found', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);
            const token = createMockToken('non-existent-id');

            const response = await request(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(401);
        });
    });

    describe('PATCH /api/users/me', () => {
        it('should update user profile', async () => {
            const updateData = {
                name: 'Updated Name',
                upiId: 'updated@upi',
                phone: '+9876543210',
            };

            const updatedUser = {
                ...mockUser,
                ...updateData,
            };

            prismaMock.user.update.mockResolvedValue(updatedUser);

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .patch('/api/users/me')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe(updateData.name);
            expect(response.body.upiId).toBe(updateData.upiId);
        });

        it('should validate UPI ID format', async () => {
            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .patch('/api/users/me')
                .set('Authorization', `Bearer ${token}`)
                .send({ upiId: 'invalid-upi-format' });

            expect(response.status).toBe(400);
        });

        it('should validate name is not empty', async () => {
            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .patch('/api/users/me')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: '' });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/users/search', () => {
        it('should search users by email', async () => {
            const searchResults = [
                {
                    id: 'user-456',
                    username: 'founduser',
                    name: 'Found User',
                    email: 'found@example.com',
                    emailVerified: true,
                    phone: '+1234567890',
                    phoneVerified: true,
                    passwordHash: null,
                    clerkId: null,
                    oauthProvider: null,
                    oauthId: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    upiId: null,
                    avatarUrl: null,
                    emoji: null,
                    currency: 'INR',
                },
            ];

            prismaMock.user.findMany.mockResolvedValue(searchResults as any);

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .get('/api/users/search?q=found')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        it('should return empty array for short search query', async () => {
            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .get('/api/users/search?q=a')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should not return current user in search results', async () => {
            prismaMock.user.findMany.mockResolvedValue([]);

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .get('/api/users/search?q=test')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.every((u: any) => u.id !== mockUser.id)).toBe(true);
        });
    });

    describe('POST /api/users/push-token', () => {
        it('should register push notification token', async () => {
            const pushTokenData = {
                token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
                device: 'android',
            };

            prismaMock.pushToken.upsert.mockResolvedValue({
                id: 'token-123',
                userId: mockUser.id,
                token: pushTokenData.token,
                device: pushTokenData.device,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .post('/api/users/push-token')
                .set('Authorization', `Bearer ${token}`)
                .send(pushTokenData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 400 without token', async () => {
            const jwtToken = createMockToken(mockUser.id);

            const response = await request(app)
                .post('/api/users/push-token')
                .set('Authorization', `Bearer ${jwtToken}`)
                .send({ device: 'android' });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/users/categories', () => {
        it('should return expense categories', async () => {
            const token = createMockToken(mockUser.id);

            const response = await request(app)
                .get('/api/users/categories')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});
