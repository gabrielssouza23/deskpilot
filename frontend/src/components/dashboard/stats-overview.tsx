"use client";

import { Card } from "@/components/ui/card";
import { CATEGORY_LABELS } from "@/lib/format";
import { useStats } from "@/lib/queries";
import { TICKET_CATEGORIES } from "@/lib/types";

function StatTile({ label, value, hint }: { label: string; value?: number; hint: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">
        {value === undefined ? <span className="text-slate-300">–</span> : value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </Card>
  );
}

export function StatsOverview() {
  const { data: stats } = useStats();
  const maxCategory = Math.max(1, ...Object.values(stats?.by_category ?? {}));

  return (
    <section aria-label="Queue overview" className="grid gap-4 lg:grid-cols-3">
      <div className="grid grid-cols-2 gap-4 lg:col-span-2">
        <StatTile label="Open" value={stats?.by_status.open} hint="Waiting on an agent" />
        <StatTile
          label="Unassigned"
          value={stats?.unassigned_open}
          hint="Open tickets with no owner"
        />
        <StatTile label="Pending" value={stats?.by_status.pending} hint="Waiting on the customer" />
        <StatTile
          label="Resolved"
          value={stats ? stats.by_status.resolved + stats.by_status.closed : undefined}
          hint={stats ? `of ${stats.total.toLocaleString()} tickets in total` : "All time"}
        />
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-medium text-slate-900">Tickets by category</h2>
        <p className="text-xs text-slate-500">All statuses, as classified by AI triage</p>
        <ul className="mt-4 space-y-3">
          {TICKET_CATEGORIES.map((category) => {
            const count = stats?.by_category[category] ?? 0;
            return (
              <li
                key={category}
                className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 text-sm"
                title={`${CATEGORY_LABELS[category]}: ${count} tickets`}
              >
                <span className="truncate text-slate-600">{CATEGORY_LABELS[category]}</span>
                <span className="h-2 rounded-r bg-slate-100">
                  <span
                    className="block h-full rounded-r bg-indigo-500 transition-[width]"
                    style={{ width: `${(count / maxCategory) * 100}%` }}
                  />
                </span>
                <span className="text-right font-medium text-slate-900 tabular-nums">{count}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}
