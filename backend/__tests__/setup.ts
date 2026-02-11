/// <reference types="jest" />

// Mock environment variables FIRST
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';
