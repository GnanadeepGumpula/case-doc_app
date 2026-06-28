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

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB Frontend Check

/**
 * Hyper-Aggressive Client-Side Compression Utility using HTML5 Canvas
 * Forces image dimensions and quality down dramatically to bypass strict Supabase limits.
 */
function compressImage(file: File, maxSize: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // CRITICAL: Max out the dimensions aggressively to 800px max width/height
        // Most mobile photos are 4000px+, which causes huge file sizes even after quality reduction.
        const MAX_BOUND = 800;
        if (width > MAX_BOUND || height > MAX_BOUND) {
          if (width > height) {
            height = Math.round((height * MAX_BOUND) / width);
            width = MAX_BOUND;
          } else {
            width = Math.round((width * MAX_BOUND) / height);
            height = MAX_BOUND;
          }
        }
        
        // Start with a lower, highly efficient compression quality (60%)
        let quality = 0.60; 
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));

        ctx.drawImage(img, 0, 0, width, height);

        const attemptCompression = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Compression failed"));
              
              // If it's still somehow over the limit, recursively shrink dimensions and quality further
              if (blob.size > maxSize && q > 0.1) {
                width = Math.round(width * 0.8);
                height = Math.round(height * 0.8);
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                attemptCompression(q - 0.1);
              } else {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              }
            },
            "image/jpeg",
            q
          );
        };

        attemptCompression(quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export function CaseForm({ initial, onSubmit, onCancel, submitLabel = "Save" }: Props) {
  const [c, setC] = useState<CaseRecord>(initial);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Custom Popup Dialog States
  const [showPopup, setShowPopup] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [oversizedCount, setOversizedCount] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof CaseRecord>(k: K, v: CaseRecord[K]) =>
    setC((prev) => ({ ...prev, [k]: v }));

  function clearFileInput() {
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  async function processAndUpload(filesToUpload: File[]) {
    setIsUploading(true);
    setUploadError(null);
    try {
      const uploadedUrls = await uploadCaseImageFiles(filesToUpload);
      const mergedPhotos = [...(c.photos ?? []), ...uploadedUrls];
      setC((prev) => ({
        ...prev,
        photos: mergedPhotos,
        photo: mergedPhotos[0] ?? undefined,
      }));
      // Successfully uploaded! Clear any active popup or errors
      setShowPopup(false);
      setUploadError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Image upload failed.";
      setUploadError(errorMessage);
      
      // If Supabase continues to throw an RLS error, catch it and force the popup window to state the issue
      if (errorMessage.toLowerCase().includes("row-level security") || errorMessage.toLowerCase().includes("policy")) {
        setPendingFiles(filesToUpload);
        setOversizedCount(filesToUpload.length);
        setShowPopup(true);
      }
    } finally {
      setIsUploading(false);
      clearFileInput();
    }
  }

  async function handlePhotos(files: FileList | null) {
    if (!files?.length) return;

    const selected = Array.from(files).filter((file) => file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name));
    const oversized = selected.filter((file) => file.size > MAX_IMAGE_SIZE);

    if (oversized.length > 0) {
      setPendingFiles(selected);
      setOversizedCount(oversized.length);
      setShowPopup(true);
    } else {
      setPendingFiles(selected);
      setOversizedCount(selected.length);
      await processAndUpload(selected);
    }
  }

  // Triggered when user clicks "Compress This Image"
  async function handleCompressAndUpload() {
    setShowPopup(false);
    setIsUploading(true);
    setUploadError("Optimizing file data and shrinking dimensions...");

    try {
      const processedFiles = await Promise.all(
        pendingFiles.map(async (file) => {
          // Pass a highly restrictive 150KB size cap internally to force canvas to shrink it down incredibly small
          return await compressImage(file, 150 * 1024);
        })
      );
      await processAndUpload(processedFiles);
    } catch (err) {
      setUploadError("Error during image compression.");
      setIsUploading(false);
      clearFileInput();
    }
  }

  function handleCancelUpload() {
    setShowPopup(false);
    setPendingFiles([]);
    setUploadError(null);
    clearFileInput();
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
    <form onSubmit={submit} className="space-y-5 relative">
      {/* --- POPUP MODAL WINDOW --- */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center gap-3 text-destructive">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-bold text-foreground">Upload Restricted</h3>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              The database rejected this upload due to an RLS size policy restriction. Tap below to heavily optimize and shrink the dimensions of this image so it can save successfully.
            </p>
            <p className="text-xs bg-muted p-2 rounded border border-border font-mono text-destructive">
              Action required: Deep image optimization
            </p>

            <div className="flex flex-col sm:flex-row items-stretch justify-end gap-2 pt-2">
              <button
                type="button"
                className="bc-btn-ghost py-2 px-4 rounded-lg text-sm transition order-2 sm:order-1"
                onClick={handleCancelUpload}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-primary text-primary-foreground font-medium py-2 px-4 rounded-lg text-sm hover:opacity-90 transition shadow-sm order-1 sm:order-2"
                onClick={handleCompressAndUpload}
              >
                Compress This Image
              </button>
            </div>
          </div>
        </div>
      )}

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
              placeholder="Enter ID number"
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
              placeholder="Select or type category"
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
              placeholder="Enter medical details"
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
              placeholder="Enter region name"
            />
          </Field>
          <Field label="Ambulance Base">
            <input
              className="bc-input"
              value={c.ambulanceBase}
              onChange={(e) => set("ambulanceBase", e.target.value)}
              placeholder="Enter hub or base station"
            />
          </Field>
          <Field label="Ambulance Contact">
            <input
              className="bc-input"
              inputMode="tel"
              value={c.ambulanceContact}
              onChange={(e) => set("ambulanceContact", e.target.value)}
              placeholder="Enter contact number"
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
              placeholder="Enter full name"
            />
          </Field>
          <Field label="EMT ID">
            <input
              className="bc-input"
              value={c.emtId}
              onChange={(e) => set("emtId", e.target.value)}
              placeholder="Enter personnel ID"
            />
          </Field>
          <Field label="Pilot Name">
            <input
              className="bc-input"
              value={c.pilotName}
              onChange={(e) => set("pilotName", e.target.value)}
              placeholder="Enter full name"
            />
          </Field>
          <Field label="Pilot ID">
            <input
              className="bc-input"
              value={c.pilotId}
              onChange={(e) => set("pilotId", e.target.value)}
              placeholder="Enter personnel ID"
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Case Details">
        <div className="space-y-4">
          <Field label="Mechanism of Injury / Nature of Illness">
            <textarea rows={3} className="bc-input" value={c.mechanism} onChange={(e) => set("mechanism", e.target.value)} placeholder="Describe event triggers..." />
          </Field>
          <Field label="Scene Description">
            <textarea rows={3} className="bc-input" value={c.sceneDescription} onChange={(e) => set("sceneDescription", e.target.value)} placeholder="Describe arrival conditions..." />
          </Field>
          <Field label="During Transport">
            <textarea rows={3} className="bc-input" value={c.duringTransport} onChange={(e) => set("duringTransport", e.target.value)} placeholder="Log patient changes during transit..." />
          </Field>
          <Field label="Hospital Handover">
            <textarea rows={3} className="bc-input" value={c.hospitalHandover} onChange={(e) => set("hospitalHandover", e.target.value)} placeholder="Note receiving facility notes..." />
          </Field>
          <Field label="Outcome">
            <textarea rows={2} className="bc-input" value={c.outcome} onChange={(e) => set("outcome", e.target.value)} placeholder="Final situational summary..." />
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
              disabled={isUploading}
              onClick={() => fileRef.current?.click()}
              className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-[11px] text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
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
            <p>Upload multiple images. Images filtered by backend boundaries will open diagnostic prompts.</p>
            {isUploading && <p className="mt-1 text-primary animate-pulse">Processing / Uploading image(s)...</p>}
            
            {uploadError && (
              <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded border border-destructive/20 flex flex-col gap-1.5 items-start">
                <span>{uploadError}</span>
                <button 
                  type="button" 
                  onClick={handleCompressAndUpload}
                  className="bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-1 rounded hover:opacity-90 active:scale-95 transition"
                >
                  Compress This Image
                </button>
              </div>
            )}
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