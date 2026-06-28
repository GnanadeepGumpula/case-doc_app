import { useRef, useState, type FormEvent, type ReactNode } from "react";
import type { CaseRecord } from "@/lib/cases";
import { uploadCaseImageFiles } from "@/lib/supabase";

interface Props {
  initial: CaseRecord;
  onSubmit: (c: CaseRecord) => void | Promise<void>;
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

const MAX_IMAGE_SIZE = 1024 * 1024;

export function CaseForm({ initial, onSubmit, onCancel, submitLabel = "Save" }: Props) {
  const [c, setC] = useState<CaseRecord>(initial);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof CaseRecord>(k: K, v: CaseRecord[K]) =>
    setC((prev) => ({ ...prev, [k]: v }));

  async function handlePhotos(files: FileList | null) {
    if (!files?.length) return;

    const selected = Array.from(files).filter((file) => file.type.startsWith("image/"));
    const oversized = selected.filter((file) => file.size > MAX_IMAGE_SIZE);
    if (oversized.length) {
      setUploadError(`Each image must be 1 MB or smaller. ${oversized.length} file(s) were skipped.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const uploadedUrls = await uploadCaseImageFiles(selected);
      const mergedPhotos = [...(c.photos ?? []), ...uploadedUrls];
      setC((prev) => ({
        ...prev,
        photos: mergedPhotos,
        photo: mergedPhotos[0] ?? undefined,
      }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!c.caseId.trim()) {
      alert("Case ID is required.");
      return;
    }
    await onSubmit(c);
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
            <textarea rows={3} className="bc-input" value={c.mechanism} onChange={(e) => set("mechanism", e.target.value)} />
          </Field>
          <Field label="Scene Description">
            <textarea rows={3} className="bc-input" value={c.sceneDescription} onChange={(e) => set("sceneDescription", e.target.value)} />
          </Field>
          <Field label="During Transport">
            <textarea rows={3} className="bc-input" value={c.duringTransport} onChange={(e) => set("duringTransport", e.target.value)} />
          </Field>
          <Field label="Hospital Handover">
            <textarea rows={3} className="bc-input" value={c.hospitalHandover} onChange={(e) => set("hospitalHandover", e.target.value)} />
          </Field>
          <Field label="Outcome">
            <textarea rows={2} className="bc-input" value={c.outcome} onChange={(e) => set("outcome", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Photos (Optional)">
        <div className="space-y-3">
          <div className="flex flex-wrap items-start gap-4">
            {c.photos?.length ? (
              c.photos.map((photo, index) => (
                <div key={`${photo}-${index}`} className="relative">
                  <img src={photo} alt={`Case photo ${index + 1}`} className="h-24 w-24 rounded-lg border border-border object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const next = (c.photos ?? []).filter((item) => item !== photo);
                      setC((prev) => ({ ...prev, photos: next, photo: next[0] ?? undefined }));
                    }}
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
              ))
            ) : null}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-[11px] text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => handlePhotos(e.target.files)}
          />
          <div className="text-xs text-muted-foreground">
            <p>Upload multiple images, up to 1 MB each. Photos are stored securely in your account.</p>
            {isUploading && <p className="mt-1 text-primary">Uploading image(s)...</p>}
            {uploadError && <p className="mt-1 text-destructive">{uploadError}</p>}
          </div>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
        {onCancel && (
          <button type="button" className="bc-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="bc-btn-primary" disabled={isUploading}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bc-card p-5">
      <h2 className="bc-section-title">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ cols, children }: { cols: 2 | 3; children: ReactNode }) {
  return <div className={`grid gap-4 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{children}</div>;
}
function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
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
