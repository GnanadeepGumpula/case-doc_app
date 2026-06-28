import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isAuthed, signOut, getUser } from "@/lib/auth";

export function AppShell() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setAuthed(isAuthed());
      setEmail(getUser()?.email ?? null);
    };
    sync();
    window.addEventListener("bestcase:auth", sync);
    return () => window.removeEventListener("bestcase:auth", sync);
  }, []);

  if (!authed) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/cases" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">Best Case</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">EMS Documentation</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/cases">Cases</NavLink>
            <NavLink to="/cases/new">New Case</NavLink>
            <NavLink to="/reports">Reports</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            {email && <span className="hidden text-xs text-muted-foreground md:inline">{email}</span>}
            <button
              className="bc-btn-outline"
              onClick={() => {
                signOut();
                router.navigate({ to: "/login" });
              }}
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="flex items-center gap-1 border-t border-border px-2 py-1 sm:hidden">
          <NavLink to="/cases">Cases</NavLink>
          <NavLink to="/cases/new">New</NavLink>
          <NavLink to="/reports">Reports</NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground"
      activeProps={{ className: "active" }}
    >
      {children}
    </Link>
  );
}
