"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { api } from "@/lib/api";

const DEMO = { email: "demo@deskpilot.dev", password: "demo1234" };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      mode === "login"
        ? api.login(credentials.email, credentials.password)
        : api.register(fullName, credentials.email, credentials.password),
    onSuccess: () => {
      const next = searchParams.get("next");
      // Only follow internal paths, never an attacker-supplied absolute URL.
      router.replace(next?.startsWith("/dashboard") ? next : "/dashboard");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({ email, password });
  }

  function signInWithDemo() {
    setMode("login");
    setEmail(DEMO.email);
    setPassword(DEMO.password);
    mutation.mutate(DEMO);
  }

  const isLogin = mode === "login";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {isLogin ? "Sign in to the agent dashboard" : "Create an agent account"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isLogin ? "Use your account or the demo one below." : "It takes ten seconds."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <Field label="Full name" htmlFor="full_name">
            <Input
              id="full_name"
              autoComplete="name"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </Field>
        )}
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          hint={isLogin ? undefined : "At least 8 characters."}
        >
          <Input
            id="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? undefined : 8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {mutation.isError && <Alert>{mutation.error.message}</Alert>}
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          {isLogin ? "Sign in" : "Create account"}
        </Button>
      </form>

      {isLogin && (
        <Button variant="secondary" className="w-full" onClick={signInWithDemo}>
          Use demo account
        </Button>
      )}

      <p className="text-center text-sm text-slate-600">
        {isLogin ? "New here? " : "Already have an account? "}
        <button
          type="button"
          className="font-medium text-indigo-600 hover:underline"
          onClick={() => {
            setMode(isLogin ? "register" : "login");
            mutation.reset();
          }}
        >
          {isLogin ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
