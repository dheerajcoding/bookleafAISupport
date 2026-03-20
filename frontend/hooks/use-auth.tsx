"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { clearAuth, getStoredUser, getToken, saveAuth } from "@/lib/storage";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { ApiResponse, User } from "@/lib/types";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  author_id?: string;
  name: string;
  email: string;
  password: string;
  city?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isReady: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => (typeof window === "undefined" ? null : getStoredUser()));
  const [token, setToken] = useState<string | null>(() => (typeof window === "undefined" ? null : getToken()));
  const isReady = true;
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      return;
    }

    connectSocket(token);
    return () => disconnectSocket();
  }, [token]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await api.post<
      ApiResponse<{ token: string; user: User }>
    >("/auth/login", payload);

    const authData = response.data.data;
    saveAuth(authData.token, authData.user);
    setToken(authData.token);
    setUser(authData.user);
    connectSocket(authData.token);

    router.push(authData.user.role === "ADMIN" ? "/admin" : "/author");
  }, [router]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await api.post<
      ApiResponse<{ token: string; user: User }>
    >("/auth/register", payload);

    const authData = response.data.data;
    saveAuth(authData.token, authData.user);
    setToken(authData.token);
    setUser(authData.user);
    connectSocket(authData.token);

    router.push("/author");
  }, [router]);

  const logout = useCallback(() => {
    clearAuth();
    disconnectSocket();
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, token, isReady, login, register, logout }),
    [user, token, isReady, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
