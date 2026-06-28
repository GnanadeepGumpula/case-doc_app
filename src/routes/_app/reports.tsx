import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { loadCases, type CaseRecord } from "@/lib/cases";
import { exportCasesToExcel } from "@/lib/case-excel";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports · Best Case Documentation" }] }),
  component: Reports,
});

function monthKey(dateStr: string) {
  // dateStr is YYYY-MM-DD
  return dateStr.slice(0, 7);
}

function Reports() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  useEffect(() => {
    const sync = () => setCases(loadCases());
    sync();
    window.addEventListener("bestcase:changed", sync);
    return () => window.removeEventListener("bestcase:changed", sync);
  }, []);

  const months = useMemo(() => {
    const map = new Map<string, CaseRecord[]>();
    for (const c of cases) {
      const k = monthKey(c.date) || "unknown";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [cases]);

  const typeTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cases) {
      const k = c.emergencyType || "Unspecified";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [cases]);

  const maxType = Math.max(1, ...typeTotals.map(([, n]) => n));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Monthly activity and emergency breakdown.</p>
        </div>
        <button
          className="bc-btn-outline"
          onClick={() =>
            exportCasesToExcel(cases, `all-cases-${new Date().toISOString().slice(0, 10)}.xlsx`)
          }
          disabled={!cases.length}
        >
          Export All to Excel
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total Cases" value={cases.length} />
        <Stat label="Months Active" value={months.length} />
        <Stat label="Emergency Types" value={typeTotals.length} />
      </div>

      <section className="bc-card p-5">
        <h2 className="bc-section-title">Cases by Emergency Type</h2>
        {typeTotals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <ul className="space-y-2">
            {typeTotals.map(([type, n]) => (
              <li key={type}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{type}</span>
                  <span className="text-muted-foreground">{n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(n / maxType) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bc-card p-5">
        <h2 className="bc-section-title">Monthly Reports</h2>
        {months.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {months.map(([m, list]) => (
              <li key={m} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{prettyMonth(m)}</div>
                  <div className="text-xs text-muted-foreground">
                    {list.length} case{list.length === 1 ? "" : "s"}
                  </div>
                </div>
                <button
                  className="bc-btn-outline"
                  onClick={() => exportCasesToExcel(list, `cases-${m}.xlsx`)}
                >
                  Export
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bc-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</div>
    </div>
  );
}

function prettyMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
}
