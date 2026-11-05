'use client';

import { createContext, use, useMemo, useState } from 'react';
import type { AuthenticatorSetup } from '@/types/auth';

interface AuthContextValue {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  authenticatorSetup: AuthenticatorSetup | null;
  setAuthenticatorSetup: (setup: AuthenticatorSetup | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authenticatorSetup, setAuthenticatorSetup] = useState<AuthenticatorSetup | null>(null);
  const value = useMemo(
    () => ({
      accessToken,
      setAccessToken,
      authenticatorSetup,
      setAuthenticatorSetup,
    }),
    [accessToken, authenticatorSetup],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuthContext() {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return context;
}
