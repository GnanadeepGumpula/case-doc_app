import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { checkCaseLimit, deleteCase, loadCases, type CaseRecord } from "@/lib/cases";
import { exportCasesToExcel } from "@/lib/case-excel";

export const Route = createFileRoute("/_app/cases/")({
  head: () => ({ meta: [{ title: "Cases · Best Case Documentation" }] }),
  component: CasesList,
});

function CasesList() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [q, setQ] = useState("");
  const [limitState, setLimitState] = useState({ count: 0, reached: false, limit: 24 });

  useEffect(() => {
    let active = true;
    const sync = async () => {
      const list = await loadCases();
      const status = await checkCaseLimit();
      if (active) {
        setCases(list);
        setLimitState(status);
      }
    };

    sync();
    window.addEventListener("bestcase:changed", sync);
    return () => {
      active = false;
      window.removeEventListener("bestcase:changed", sync);
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return cases;
    return cases.filter((c) =>
      [c.caseId, c.emergencyType, c.subType, c.district, c.ambulanceBase, c.emtName, c.pilotName]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [cases, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cases</h1>
          <p className="text-sm text-muted-foreground">
            {cases.length} total · {filtered.length} shown
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Storage: {limitState.count}/{limitState.limit} cases used {limitState.reached ? "(limit reached)" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="bc-btn-outline"
            onClick={() => exportCasesToExcel(filtered, `cases-${new Date().toISOString().slice(0, 10)}.xlsx`)}
            disabled={!filtered.length}
          >
            Export Excel
          </button>
          {limitState.reached ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Delete old cases to create more.
            </div>
          ) : (
            <Link to="/cases/new" className="bc-btn-primary">
              + New Case
            </Link>
          )}
        </div>
      </div>

      <div className="bc-card p-3">
        <input
          className="bc-input"
          placeholder="Search by Case ID, emergency, district, EMT, pilot…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bc-card flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">No cases yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Document your first emergency response. Cases are saved securely to your account.
          </p>
          <Link to="/cases/new" className="bc-btn-primary mt-5">
            Create a case
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="bc-card group relative overflow-hidden transition hover:border-primary/40 hover:shadow-md"
            >
              <Link to="/cases/$id" params={{ id: c.id }} className="block p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">#{c.caseId || "—"}</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{c.emergencyType || "Untitled"}</div>
                    {c.subType && <div className="text-xs text-muted-foreground">{c.subType}</div>}
                  </div>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-foreground">
                    {c.date}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <Field label="District" value={c.district} />
                  <Field label="Base" value={c.ambulanceBase} />
                  <Field label="EMT" value={c.emtName} />
                  <Field label="Pilot" value={c.pilotName} />
                </div>
              </Link>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  if (confirm(`Delete case ${c.caseId || c.id.slice(0, 6)}? This cannot be undone.`)) {
                    await deleteCase(c.id);
                  }
                }}
                className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                aria-label="Delete case"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</div>
      <div className="truncate text-xs font-medium text-foreground">{value || "—"}</div>
    </div>
  );
}
