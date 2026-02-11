import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

const mockPrismaClient = mockDeep<PrismaClient>();
jest.mock('../../src/lib/prisma', () => ({
    __esModule: true,
    prisma: mockPrismaClient,
}));

import request from 'supertest';
import express from 'express';
import { authRouter } from '../../src/routes/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../../src/middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use(errorHandler);

describe('Auth Routes', () => {
    const prismaMock = mockPrismaClient;

    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();
    });
    describe('POST /api/auth/register', () => {
        it('should create a new user with valid data', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                email: 'test@example.com',
                emailVerified: false,
                name: 'Test User',
                phone: '+1234567890',
                phoneVerified: false,
                passwordHash: await bcrypt.hash('password123', 10),
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

            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User',
                    phone: '+1234567890',
                    username: 'testuser',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('needsVerification', true);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should return 400 if user already exists', async () => {
            const existingUser = {
                id: 'user-123',
                username: 'existinguser',
                email: 'existing@example.com',
                emailVerified: true,
                name: 'Existing User',
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

            prismaMock.user.findUnique.mockResolvedValue(existingUser);

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'existing@example.com',
                    password: 'password123',
                    name: 'New User',
                    phone: '+9876543210',
                    username: 'newuser',
                });

            expect(response.status).toBe(400);
        });

        it('should return 400 with invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                    name: 'Test User',
                    phone: '+1234567890',
                    username: 'testuser',
                });

            expect(response.status).toBe(400);
        });

        it('should return 400 with weak password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: '123',
                    name: 'Test User',
                    phone: '+1234567890',
                    username: 'testuser',
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                email: 'test@example.com',
                emailVerified: true,
                name: 'Test User',
                phone: '+1234567890',
                phoneVerified: true,
                passwordHash: hashedPassword,
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

            prismaMock.user.findFirst.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('test@example.com');
        });

        it('should return 401 with invalid credentials', async () => {
            prismaMock.user.findFirst.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: 'nonexistent@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(401);
            // expect(response.body.error).toContain('Invalid credentials');
        });

        it('should return 401 with wrong password', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                email: 'test@example.com',
                emailVerified: true,
                name: 'Test User',
                phone: '+1234567890',
                phoneVerified: true,
                passwordHash: hashedPassword,
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

            prismaMock.user.findFirst.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: 'test@example.com',
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
        });
    });


});
