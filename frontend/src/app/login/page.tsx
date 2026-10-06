import type { Metadata } from "next";
import { Suspense } from "react";

import { Logo } from "@/components/logo";
import { Card } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Agent login" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <Logo />
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </Card>
    </main>
  );
}
