import { Suspense } from "react";

import { StatsOverview } from "@/components/dashboard/stats-overview";
import { TicketQueue } from "@/components/dashboard/ticket-queue";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Support overview</h1>
        <p className="mt-1 text-sm text-slate-600">
          New tickets are categorized and prioritized automatically. Pick one up from the queue.
        </p>
      </div>
      <StatsOverview />
      {/* TicketQueue reads filters from the URL, which requires a Suspense boundary. */}
      <Suspense>
        <TicketQueue />
      </Suspense>
    </div>
  );
}
