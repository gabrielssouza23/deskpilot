import { Bot, Gauge, MessageSquareReply, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { TicketForm } from "@/components/ticket-form";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Bot,
    title: "AI triage in the background",
    text: "Claude reads every new ticket and sets its category, priority, sentiment and language.",
  },
  {
    icon: MessageSquareReply,
    title: "Suggested replies",
    text: "Agents start from a draft written in the customer's own language, then edit and send.",
  },
  {
    icon: Gauge,
    title: "One dashboard",
    text: "Search, filter and sort the queue so urgent tickets never get buried.",
  },
  {
    icon: ShieldCheck,
    title: "Fails safely",
    text: "If the AI is unavailable, a rule-based classifier takes over so no ticket is left behind.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Agent login →
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-16">
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-600/20">
              Portfolio project · Next.js + FastAPI + Claude
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
              The helpdesk that triages tickets for you.
            </h1>
            <p className="text-lg text-pretty text-slate-600">
              DeskPilot turns a messy support inbox into a prioritized queue. Customers send a
              request; AI sorts it and drafts the first reply; agents review and respond.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Try the demo</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Submit a request with the form as if you were a customer.</li>
              <li>
                <Link href="/login" className="font-medium text-indigo-600 hover:underline">
                  Log in as an agent
                </Link>{" "}
                with <code className="font-mono text-xs">demo@deskpilot.dev</code> /{" "}
                <code className="font-mono text-xs">demo1234</code>.
              </li>
              <li>Open your ticket to see the AI triage and the suggested reply.</li>
            </ol>
          </div>
        </section>

        <section aria-labelledby="contact-heading">
          <Card className="p-6 sm:p-8">
            <h2 id="contact-heading" className="text-xl font-semibold text-slate-900">
              Contact support
            </h2>
            <p className="mt-1 mb-6 text-sm text-slate-600">
              We usually answer within a few hours.
            </p>
            <TicketForm />
          </Card>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        Built by{" "}
        <a
          href="https://github.com/gabrielssouza23"
          className="font-medium text-slate-700 hover:text-indigo-600"
        >
          Gabriel de Souza Silva
        </a>
      </footer>
    </div>
  );
}
