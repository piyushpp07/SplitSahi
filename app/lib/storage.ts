/**
 * Offline cache: store API responses in AsyncStorage-like storage.
 * Uses expo-secure-store for tokens; for cache we use a simple in-memory + optional persistence.
 */

import * as SecureStore from "expo-secure-store";

const CACHE_PREFIX = "splitsahise_cache_";
const CACHE_TTL_KEY = "splitsahise_cache_ttl";

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; expiresAt: number };
    if (Date.now() > parsed.expiresAt) {
      await SecureStore.deleteItemAsync(CACHE_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export async function setCached(key: string, data: unknown, ttlMs = 5 * 60 * 1000): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      CACHE_PREFIX + key,
      JSON.stringify({ data, expiresAt: Date.now() + ttlMs })
    );
  } catch {
    // ignore
  }
}