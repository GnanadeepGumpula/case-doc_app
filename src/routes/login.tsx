import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { HelpCircle, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Tooltip helper states
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const navigate = useNavigate();

  const toggleTooltip = (field: string) => {
    setActiveTooltip(activeTooltip === field ? null : field);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("All authentication fields are strictly mandatory.");
      toast.error("Authentication failed: Missing inputs.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("bestcase.remember-me", rememberMe ? "1" : "0");
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Direct Signup - Table Row generation without confirmation blocking
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });

        if (error) throw error;

        toast.success("Account initialized successfully in database!");

        // Since Email Confirmation is OFF, log them in immediately
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginErr) throw loginErr;
        navigate({ to: "/cases" });
      } else {
        // Explicit credential verification against live table rows
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) throw error;

        toast.success("Identity verified. Access granted.");
        navigate({ to: "/cases" });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Invalid email or matching security key.";
      console.error("Auth error:", message);
      setFormError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-radial from-background to-secondary/30 px-4">
      {/* Corner Logo Watermark Placement */}
      <div className="absolute top-6 left-6 flex items-center gap-2 opacity-60 selection:bg-transparent">
        <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
        <span className="text-xs font-semibold tracking-widest uppercase text-brand">
          CaseDoc Matrix
        </span>
      </div>

      <div className="bc-card w-full max-w-md p-8 border border-border/60 bg-card/80 backdrop-blur-md shadow-2xl relative overflow-hidden transition-all duration-300">
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/logo.png"
            alt="Main Logo"
            className="h-16 w-16 object-contain mb-3 drop-shadow"
          />
          <h2 className="text-2xl font-bold tracking-tight text-brand">
            {isSignUp ? "Register Master Account" : "Clinical Matrix Sign-In"}
          </h2>
        </div>

        {/* Dynamic Context Pop-up Error Alerts */}
        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-5">
          {/* Email Input Wrapper */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="bc-label mb-0">Email ID</label>
              <button
                type="button"
                onClick={() => toggleTooltip("email")}
                className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>

            {activeTooltip === "email" && (
              <div className="mb-2 p-2 rounded bg-secondary text-[11px] leading-relaxed text-muted-foreground border border-border animate-in fade-in duration-200">
                Provide your institutional email mapping identifier. Example:
                `gnanadeep@domain.com`. This functions as your primary secure unique database key
                row.
              </div>
            )}

            <input
              type="email"
              className="bc-input bg-background/50 focus:bg-background transition-all"
              placeholder="username@clinical.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input Wrapper */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="bc-label mb-0">Password</label>
              <button
                type="button"
                onClick={() => toggleTooltip("password")}
                className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>

            {activeTooltip === "password" && (
              <div className="mb-2 p-2 rounded bg-secondary text-[11px] leading-relaxed text-muted-foreground border border-border animate-in fade-in duration-200">
                Enter your private alphanumeric access token. Must contain at least 6 secure
                database characters to safeguard patient data records.
              </div>
            )}

            <input
              type="password"
              className="bc-input bg-background/50 focus:bg-background transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Keep me signed in on this device
          </label>

          <button
            type="submit"
            className="bc-btn-brand w-full py-2.5 shadow-lg shadow-brand/20 active:scale-[0.99] transition-transform flex items-center justify-center gap-2 cursor-pointer font-semibold"
            disabled={isLoading}
          >
            {isLoading
              ? "Synchronizing Matrix..."
              : isSignUp
                ? "Establish Cloud Identity"
                : "Verify Credentials"}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-border/50 text-center">
          <button
            type="button"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors bg-none border-none cursor-pointer"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setFormError(null);
            }}
          >
            {isSignUp
              ? "Already mapped to database? Access Identity Profile"
              : "Generate a premium non-verified database account layout"}
          </button>
        </div>
      </div>
    </div>
  );
}
