import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Create a deep mock of Prisma Client for each test
export const createPrismaMock = () => {
    return mockDeep<PrismaClient>();
};

// Type for the mocked Prisma client
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

// Mock the Prisma module globally
export const mockPrisma = () => {
    const prismaMock = createPrismaMock();

    jest.doMock('../../src/lib/prisma', () => ({
        __esModule: true,
        prisma: prismaMock,
    }));

    return prismaMock;
};
