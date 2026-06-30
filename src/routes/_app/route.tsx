import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { LogOut, LayoutDashboard, FileSpreadsheet, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayoutComponent,
});

function AppLayoutComponent() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Secure diagnostic session terminated safely.");
    window.location.href = "/login";
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      {/* Premium Corporate Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/80 backdrop-blur-md px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="System Logo" className="h-9 w-9 object-contain" />
          <div>
            <span className="text-sm font-bold tracking-tight text-brand block leading-none">
              Best Case Documentation
            </span>
          </div>
        </div>

        {/* Action Toggle Button */}
        <button
          onClick={toggleMenu}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors duration-200 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Floating Contextual Dropdown Menu */}
        {menuOpen && (
          <>
            {/* Click-away overlay background layer */}
            <div className="fixed inset-0 z-40 bg-black/5" onClick={closeMenu} />
            
            <nav className="absolute right-6 top-14 z-50 min-w-[200px] rounded-lg border border-border bg-card p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-1">
              <Link
                to="/cases"
                onClick={closeMenu}
                className="w-full px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-2.5 text-muted-foreground hover:text-brand hover:bg-muted/60 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Cases Ledger
              </Link>
              
              <Link
                to="/reports"
                onClick={closeMenu}
                className="w-full px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-2.5 text-muted-foreground hover:text-brand hover:bg-muted/60 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Analytics Matrix
              </Link>

              <div className="h-[1px] bg-border my-1 w-full" />

              <button
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                className="w-full text-left text-destructive hover:bg-destructive/10 px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </nav>
          </>
        )}
      </header>

      {/* Main Core Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 animate-in fade-in duration-300">
        <Outlet />
      </main>
    </div>
  );
}