import { useRef, useState } from "react";
import type { CaseRecord } from "@/lib/cases";

interface Props {
  initial: CaseRecord;
  onSubmit: (c: CaseRecord) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

const EMERGENCY_TYPES = [
  "Respiratory Emergency",
  "Cardiac Emergency",
  "Trauma",
  "Obstetric Emergency",
  "Pediatric Emergency",
  "Neurological Emergency",
  "Burns",
  "Poisoning",
  "Other",
];

export function CaseForm({ initial, onSubmit, onCancel, submitLabel = "Save" }: Props) {
  const [c, setC] = useState<CaseRecord>(initial);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof CaseRecord>(k: K, v: CaseRecord[K]) =>
    setC((prev) => ({ ...prev, [k]: v }));

  function handlePhoto(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("photo", reader.result as string);
    reader.readAsDataURL(file);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!c.caseId.trim()) {
      alert("Case ID is required.");
      return;
    }
    onSubmit(c);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Section title="Case Information">
        <Grid cols={3}>
          <Field label="Date" required>
            <input
              type="date"
              required
              className="bc-input"
              value={c.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </Field>
          <Field label="Case ID" required>
            <input
              required
              className="bc-input"
              value={c.caseId}
              onChange={(e) => set("caseId", e.target.value)}
              placeholder="36010150"
            />
          </Field>
          <Field label="Call Time" required>
            <input
              type="time"
              required
              className="bc-input"
              value={c.callTime}
              onChange={(e) => set("callTime", e.target.value)}
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Emergency">
        <Grid cols={2}>
          <Field label="Emergency Type">
            <input
              list="emergency-types"
              className="bc-input"
              value={c.emergencyType}
              onChange={(e) => set("emergencyType", e.target.value)}
              placeholder="Respiratory Emergency"
            />
            <datalist id="emergency-types">
              {EMERGENCY_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Sub-Type">
            <input
              className="bc-input"
              value={c.subType}
              onChange={(e) => set("subType", e.target.value)}
              placeholder="Food Aspiration with Respiratory Distress"
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Location & Base">
        <Grid cols={3}>
          <Field label="District">
            <input
              className="bc-input"
              value={c.district}
              onChange={(e) => set("district", e.target.value)}
              placeholder="Peddapalli"
            />
          </Field>
          <Field label="Ambulance Base">
            <input
              className="bc-input"
              value={c.ambulanceBase}
              onChange={(e) => set("ambulanceBase", e.target.value)}
              placeholder="MCH Peddapalli"
            />
          </Field>
          <Field label="Ambulance Contact">
            <input
              className="bc-input"
              inputMode="tel"
              value={c.ambulanceContact}
              onChange={(e) => set("ambulanceContact", e.target.value)}
              placeholder="8341800854"
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Personnel">
        <Grid cols={2}>
          <Field label="EMT Name">
            <input
              className="bc-input"
              value={c.emtName}
              onChange={(e) => set("emtName", e.target.value)}
              placeholder="Ravi"
            />
          </Field>
          <Field label="EMT ID">
            <input
              className="bc-input"
              value={c.emtId}
              onChange={(e) => set("emtId", e.target.value)}
              placeholder="207676"
            />
          </Field>
          <Field label="Pilot Name">
            <input
              className="bc-input"
              value={c.pilotName}
              onChange={(e) => set("pilotName", e.target.value)}
              placeholder="V Anil"
            />
          </Field>
          <Field label="Pilot ID">
            <input
              className="bc-input"
              value={c.pilotId}
              onChange={(e) => set("pilotId", e.target.value)}
              placeholder="206262"
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Case Details">
        <div className="space-y-4">
          <Field label="Mechanism of Injury / Nature of Illness">
            <textarea
              rows={3}
              className="bc-input"
              value={c.mechanism}
              onChange={(e) => set("mechanism", e.target.value)}
            />
          </Field>
          <Field label="Scene Description">
            <textarea
              rows={3}
              className="bc-input"
              value={c.sceneDescription}
              onChange={(e) => set("sceneDescription", e.target.value)}
            />
          </Field>
          <Field label="During Transport">
            <textarea
              rows={3}
              className="bc-input"
              value={c.duringTransport}
              onChange={(e) => set("duringTransport", e.target.value)}
            />
          </Field>
          <Field label="Hospital Handover">
            <textarea
              rows={3}
              className="bc-input"
              value={c.hospitalHandover}
              onChange={(e) => set("hospitalHandover", e.target.value)}
            />
          </Field>
          <Field label="Outcome">
            <textarea
              rows={2}
              className="bc-input"
              value={c.outcome}
              onChange={(e) => set("outcome", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Photo (Optional)">
        <div className="flex items-start gap-4">
          {c.photo ? (
            <div className="relative">
              <img
                src={c.photo}
                alt="Case"
                className="h-32 w-32 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => set("photo", undefined)}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
                aria-label="Remove photo"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-3.5 w-3.5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Photo
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0])}
          />
          <p className="max-w-xs text-xs text-muted-foreground">
            Stored locally and embedded in the case PDF. Keep images small for best performance.
          </p>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
        {onCancel && (
          <button type="button" className="bc-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="bc-btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bc-card p-5">
      <h2 className="bc-section-title">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }) {
  return (
    <div className={`grid gap-4 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {children}
    </div>
  );
}
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="bc-label">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      {children}
    </label>
  );
}
