"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/infrastructure/auth/AuthProvider";
import { ConfirmDialogProvider } from "@/presentation/components/providers/ConfirmDialogProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConfirmDialogProvider>
          {children}
          <Toaster position="top-right" richColors />
        </ConfirmDialogProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
