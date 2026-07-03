"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "./client";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app exactly once (mounted in src/app/layout.tsx, around
 * AppContainer) so every screen shares the same cache. `getQueryClient()`
 * returns the stable per-tab singleton on the client and a fresh client
 * per render on the server, per the official Next.js App Router pattern.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
