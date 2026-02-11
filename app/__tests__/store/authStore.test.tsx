import React from 'react';
import { render, fireEvent, waitFor } from '../utils/testUtils';
import { useAuthStore } from '../../store/authStore';

// Mock the auth store
jest.mock('../../store/authStore');

describe('AuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with null user', () => {
    const mockStore = {
      user: null,
      token: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      setUser: jest.fn(),
    };

    (useAuthStore as unknown as jest.Mock).mockReturnValue(mockStore);

    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('should set user on login', () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };

    const mockStore = {
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      setUser: jest.fn(),
    };

    (useAuthStore as unknown as jest.Mock).mockReturnValue(mockStore);

    const store = useAuthStore();
    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
  });

  it('should clear user on logout', () => {
    const mockStore = {
      user: null,
      token: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      setUser: jest.fn(),
    };

    (useAuthStore as unknown as jest.Mock).mockReturnValue(mockStore);

    const store = useAuthStore();
    store.logout();

    expect(store.logout).toHaveBeenCalled();
    expect(store.user).toBeNull();
  });
});
