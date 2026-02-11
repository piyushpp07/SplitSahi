import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  const testQueryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react-native';
export { customRender as render };

// Mock user data
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+1234567890',
  avatarUrl: null,
  upiId: 'test@upi',
  currency: 'INR',
};

export const mockGroup = {
  id: 'group-123',
  name: 'Test Group',
  description: 'Test Description',
  inviteCode: 'ABC123',
  members: [
    {
      id: 'member-123',
      userId: mockUser.id,
      role: 'ADMIN',
      user: mockUser,
    },
  ],
  _count: {
    members: 1,
    expenses: 5,
  },
};

export const mockExpense = {
  id: 'expense-123',
  title: 'Test Expense',
  totalAmount: 500,
  category: 'Food',
  date: new Date().toISOString(),
  groupId: mockGroup.id,
  createdById: mockUser.id,
  payers: [
    {
      userId: mockUser.id,
      amountPaid: 500,
      user: mockUser,
    },
  ],
  splits: [
    {
      userId: mockUser.id,
      amountOwed: 500,
      user: mockUser,
    },
  ],
  currency: 'INR',
};

// Mock fetch
export const mockFetch = (response: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
    } as Response)
  );
};

export const mockFetchError = (status: number = 404, error: string = 'Not found') => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ error }),
    } as Response)
  );
};
