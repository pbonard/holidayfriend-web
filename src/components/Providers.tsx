'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/api/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
