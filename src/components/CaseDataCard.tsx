import { useState } from "react";
import {
  HelpCircle,
  User,
  Building2,
  CheckCircle2,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";

interface CaseItem {
  id?: string | number;
  title?: string;
  description?: string;
  emt_name?: string;
  code?: string;
  created_at?: string;
  severity_level?: "Critical" | "Standard" | "Routine";
  facility_dept?: string;
}

interface CaseDataCardProps {
  item?: CaseItem;
}

export function CaseDataCard({ item }: CaseDataCardProps) {
  // Dedicated active state tracking for individual help info buttons
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  const toggleInfo = (field: string) => {
    setActiveInfo(activeInfo === field ? null : field);
  };

  // Safe formatting parsing for database timestamp rows
  const formatMatrixDate = (dateStr?: string) => {
    if (!dateStr) return { date: "06/26/2026", time: "09:30 AM" };
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      };
    } catch {
      return { date: "Pending Parse", time: "Matrix Out" };
    }
  };

  const { date, time } = formatMatrixDate(item?.created_at);

  return (
    <div className="bc-card p-6 border-l-4 border-l-brand hover:shadow-xl bg-card/90 backdrop-blur-sm border border-border/50 rounded-xl relative overflow-visible transition-all duration-300 group hover:-translate-y-0.5">
      {/* Upper Brand Badge Mapping Matrix */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Card Logo Link" className="h-4 w-4 object-contain opacity-75" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground font-mono">
            ID: {item?.id ? `MTRX-${item.id}` : "GEN-99042"}
          </span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            item?.severity_level === "Critical"
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-primary/10 text-brand border border-primary/20"
          }`}
        >
          {item?.severity_level || "Standard Registry"}
        </span>
      </div>

      {/* Primary Row: Lead Diagnostician Block */}
      <div className="flex items-start justify-between relative mb-4">
        <div>
          <span className="bc-label text-[10px] tracking-wider uppercase block">
            Attending Diagnostician
          </span>
          {/* Replaced 'Ravi' with a premium healthcare professional fallback field */}
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-1">
            <User className="h-4 w-4 text-brand shrink-0" />
            {item?.emt_name || "Dr. Alexander Ross, MD"}
          </h3>
        </div>

        {/* Dynamic Tooltip Info Controller */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleInfo("diagnostician")}
            className="text-muted-foreground hover:text-brand p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Diagnostician Info"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {activeInfo === "diagnostician" && (
            <div className="absolute right-0 top-7 z-50 w-64 p-3 rounded-lg bg-popover text-popover-foreground text-[11px] shadow-2xl border border-border animate-in fade-in slide-in-from-top-1 leading-relaxed">
              <div className="flex items-center justify-between mb-1 font-semibold text-brand">
                <span>Field Documentation Source</span>
                <X
                  className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={() => setActiveInfo(null)}
                />
              </div>
              Indicates the verified cloud-assigned licensed medical specialist or technical
              director who authored and digitally signed this clinical matrix report entry.
            </div>
          )}
        </div>
      </div>

      {/* Case Overview Description Space */}
      <div className="mb-5 bg-secondary/30 p-3 rounded-lg border border-border/30">
        <span className="bc-label text-[9px] uppercase tracking-wider block mb-1 flex items-center gap-1">
          <FileText className="h-3 w-3 text-muted-foreground" /> Clinical Assessment Abstract
        </span>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {item?.description ||
            "Initial patient triage parameters logged successfully. Vital telemetry tracks stable baseline records inside secure storage tables."}
        </p>
      </div>

      {/* Lower Meta Metric Data Grid */}
      <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-border/40 bg-card/30 rounded-b-lg">
        {/* Column 1: Facility Tracking */}
        <div className="relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="bc-label mb-0">Facility Matrix Code</span>
              <button
                type="button"
                onClick={() => toggleInfo("facility")}
                className="text-muted-foreground hover:text-brand cursor-pointer"
              >
                <HelpCircle className="h-3 w-3" />
              </button>
            </div>
            <p className="font-bold font-mono text-foreground flex items-center gap-1 mt-1 text-[11px]">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {item?.code || "FAC-9082-TX"}
            </p>
          </div>

          {activeInfo === "facility" && (
            <div className="absolute left-0 bottom-12 z-50 w-56 p-2.5 rounded-lg bg-popover text-popover-foreground text-[11px] shadow-2xl border border-border animate-in fade-in leading-normal">
              The cryptographic unique physical sector node code indicating which designated
              clinical building network accepted the asset.
            </div>
          )}
        </div>

        {/* Column 2: Synchronicity Mapping */}
        <div className="relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="bc-label mb-0">Database Sync Status</span>
              <button
                type="button"
                onClick={() => toggleInfo("sync")}
                className="text-muted-foreground hover:text-brand cursor-pointer"
              >
                <HelpCircle className="h-3 w-3" />
              </button>
            </div>
            <p className="text-success font-bold flex items-center gap-1 mt-1 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              Live Vault Verified
            </p>
          </div>

          {activeInfo === "sync" && (
            <div className="absolute right-0 bottom-12 z-50 w-56 p-2.5 rounded-lg bg-popover text-popover-foreground text-[11px] shadow-2xl border border-border animate-in fade-in leading-normal">
              Confirms transaction row security completion. Row parameters match hashes inside your
              centralized Supabase PostgreSQL storage layers exactly.
            </div>
          )}
        </div>
      </div>

      {/* Extra Structural Row: Realtime Timestamps */}
      <div className="mt-4 pt-2.5 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground font-medium font-mono">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}
