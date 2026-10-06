"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { api, ApiError } from "@/lib/api";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(() => {
    let redirecting = false;

    function onError(error: Error) {
      if (redirecting || !(error instanceof ApiError) || error.status !== 401) return;
      const { pathname } = window.location;
      if (!pathname.startsWith("/dashboard")) return;

      // The session is no longer valid. Clear the cookie first, otherwise the
      // proxy would see it and bounce /login straight back to /dashboard.
      redirecting = true;
      void api.logout().finally(() => {
        redirecting = false;
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      });
    }

    return new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: {
        queries: {
          staleTime: 10_000,
          // Retry network and server errors, but not 4xx responses.
          retry: (failureCount, error) =>
            !(error instanceof ApiError && error.status < 500) && failureCount < 2,
        },
      },
    });
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
