import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "splititup_token";
const USER_KEY = "splititup_user";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  upiId?: string | null;
  avatarUrl?: string | null;
  currency?: string;
  createdAt?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  setAuth: (token: string, user: User) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,
  setAuth: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  setUser: async (user) => {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null });
  },
  hydrate: async () => {
    try {
      const [token, userRaw] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      const user = userRaw ? (JSON.parse(userRaw) as User) : null;
      set({ token, user, hydrated: true });
    } catch {
      set({ token: null, user: null, hydrated: true });
    }
  },
}));
