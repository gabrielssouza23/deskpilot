"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useMe } from "@/lib/queries";

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  async function logout() {
    await api.logout();
    queryClient.clear();
    router.replace("/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-3">
            {me && (
              <div className="hidden items-center gap-2 sm:flex">
                <Avatar name={me.full_name} />
                <span className="text-sm font-medium text-slate-700">{me.full_name}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="size-4" aria-hidden />
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
