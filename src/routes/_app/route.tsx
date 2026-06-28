import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { LogOut, LayoutDashboard, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayoutComponent,
});

function AppLayoutComponent() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Secure diagnostic session terminated safely.");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      {/* Premium Corporate Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-card/80 backdrop-blur-md px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="System Logo" className="h-9 w-9 object-contain" />
          <div>
            <span className="text-sm font-bold tracking-tight text-brand block leading-none">
              Matrix Analytics
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5 block">
              Admin Layer • Gnanadeep Gumpula
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          <Link
            to="/cases"
            className="bc-btn-ghost px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 text-muted-foreground hover:text-brand"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Cases Ledger
          </Link>
          <Link
            to="/reports"
            className="bc-btn-ghost px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 text-muted-foreground hover:text-brand"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Analytics Matrix
          </Link>

          <div className="h-4 w-[1px] bg-border mx-2" />

          <button
            onClick={handleLogout}
            className="bc-btn-outline border-destructive/20 hover:bg-destructive/10 text-destructive px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </nav>
      </header>

      {/* Main Core Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 animate-in fade-in duration-300">
        <Outlet />
      </main>

      {/* Enterprise Signature Footer */}
      <footer className="w-full border-t border-border/40 bg-card/40 py-4 px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Footer Logo" className="h-4 w-4 object-contain opacity-50" />
          <span>© 2026 Sovereign Systems. All data records encrypted via Supabase Cluster.</span>
        </div>
        <div className="font-semibold text-brand tracking-wide mt-2 sm:mt-0">
          Developed by Gnanadeep Gumpula
        </div>
      </footer>
    </div>
  );
}
