import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { tokenStorage, userStorage } from '../api/client';
import i18n, { SUPPORTED_LOCALES, type SupportedLocale } from '../i18n';
import type { User } from '../types/models';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (loginValue: string, password: string) => Promise<{ requiresTwoFactor: boolean; challenge?: string }>;
  register: (payload: authApi.RegisterInput) => Promise<void>;
  verifyTwoFactor: (challenge: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function syncLocale(user: User | null): void {
  const locale = user?.locale;
  if (locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale) && locale !== i18n.language) {
    i18n.changeLanguage(locale);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = tokenStorage.get() ? userStorage.get<User>() : null;
    syncLocale(stored);
    return stored;
  });

  const applyAuthResult = (result: authApi.LoginResult) => {
    if (result.token && result.user) {
      tokenStorage.set(result.token);
      userStorage.set(result.user);
      setUser(result.user);
      syncLocale(result.user);
    }
  };

  const login = useCallback(async (loginValue: string, password: string) => {
    const result = await authApi.login(loginValue, password);

    if (result.two_factor_required) {
      return { requiresTwoFactor: true, challenge: result.challenge };
    }

    applyAuthResult(result);

    return { requiresTwoFactor: false };
  }, []);

  const register = useCallback(async (payload: authApi.RegisterInput) => {
    const result = await authApi.register(payload);
    applyAuthResult(result);
  }, []);

  const verifyTwoFactor = useCallback(async (challenge: string, code: string) => {
    const result = await authApi.verifyTwoFactor(challenge, code);
    applyAuthResult(result);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      userStorage.set(next);
      syncLocale(next);
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStorage.clear();
      userStorage.clear();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, verifyTwoFactor, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
