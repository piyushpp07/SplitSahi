import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * API client for SplitItUp backend.
 * Uses React Query in components; this is the raw fetch wrapper.
 */

const getLocalUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // In development, try to use the Expo host IP (LAN IP)
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(":")[0];

  if (localhost) {
    return `http://${localhost}:4000/api`;
  }

  // Fallback for Android Emulator (10.0.2.2) or iOS Simulator (localhost)
  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000/api";
  }
  return "http://localhost:4000/api";
}

export const API_URL = getLocalUrl();
const API_BASE = API_URL;

export type ApiError = { error: string; code?: string; data?: any };

export class RequestError extends Error {
  code?: string;
  data?: any;
  constructor(message: string, code?: string, data?: any) {
    super(message);
    this.name = "RequestError";
    this.code = code;
    this.data = data;
  }
}

async function getToken(): Promise<string | null> {
  try {
    const { getToken } = await import("@/store/authStore");
    return getToken();
  } catch {
    return null;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...init } = options;
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (skipAuth !== true) {
    const token = await getToken();
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`; // Authorization: Bearer <token>
  }

  // console.log(`[API] ${init.method || 'GET'} ${url}`);

  const res = await fetch(url, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const err = data as ApiError;
    throw new RequestError(err.error ?? `Request failed: ${res.status}`, err.code, err.data);
  }
  return data as T;
}

type ApiOptions = RequestInit & { skipAuth?: boolean };

export const apiGet = <T>(path: string, options?: ApiOptions) =>
  api<T>(path, { ...options, method: "GET" });
export const apiPost = <T>(path: string, body?: unknown, options?: ApiOptions) =>
  api<T>(path, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined });
export const apiPatch = <T>(path: string, body?: unknown, options?: ApiOptions) =>
  api<T>(path, { ...options, method: "PATCH", body: body ? JSON.stringify(body) : undefined });
export const apiDelete = <T>(path: string, options?: ApiOptions) =>
  api<T>(path, { ...options, method: "DELETE" });
