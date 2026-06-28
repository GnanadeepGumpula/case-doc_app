import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CaseForm } from "@/components/CaseForm";
import { getCase, upsertCase, deleteCase, type CaseRecord } from "@/lib/cases";
import { downloadCaseXlsx, shareCaseXlsx } from "@/lib/case-xlsx";

export const Route = createFileRoute("/_app/cases/$id")({
  head: () => ({ meta: [{ title: "Case · Best Case Documentation" }] }),
  component: CaseDetail,
});

function CaseDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const c = await getCase(id);
      if (active) setRecord(c ?? null);
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (!record) return null;

  if (editing) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Case</h1>
          <p className="text-sm text-muted-foreground">#{record.caseId || record.id.slice(0, 8)}</p>
        </div>
        <CaseForm
          initial={record}
          onSubmit={async (c) => {
            await upsertCase({ ...c, updatedAt: Date.now() });
            setRecord(c);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
          submitLabel="Save Changes"
        />
      </div>
    );
  }

  const shareWhatsApp = async () => {
    await shareCaseXlsx(record, "whatsapp");
  };
  const shareEmail = async () => {
    await shareCaseXlsx(record, "email");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/cases" className="text-xs text-muted-foreground hover:text-foreground">← All Cases</Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{record.emergencyType || "Case"}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">#{record.caseId || "—"}</span> · {record.date} {record.callTime}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="bc-btn-outline" onClick={() => setEditing(true)}>Edit</button>
          <button className="bc-btn-brand" onClick={() => downloadCaseXlsx(record)}>Download Excel</button>
          <button className="bc-btn-outline" onClick={shareWhatsApp}>WhatsApp</button>
          <button className="bc-btn-outline" onClick={shareEmail}>Email</button>
          <button
            className="bc-btn-danger"
            onClick={async () => {
              if (confirm("Delete this case? This cannot be undone.")) {
                await deleteCase(record.id);
                router.navigate({ to: "/cases" });
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="bc-card p-5 lg:col-span-2 space-y-5">
          <Section title="Emergency">
            <Detail label="Type" value={record.emergencyType} />
            <Detail label="Sub-Type" value={record.subType} />
          </Section>
          <Section title="Location & Base">
            <Detail label="District" value={record.district} />
            <Detail label="Ambulance Base" value={record.ambulanceBase} />
            <Detail label="Ambulance Contact" value={record.ambulanceContact} />
          </Section>
          <Section title="Personnel">
            <Detail label="EMT" value={`${record.emtName}${record.emtId ? ` (${record.emtId})` : ""}`} />
            <Detail label="Pilot" value={`${record.pilotName}${record.pilotId ? ` (${record.pilotId})` : ""}`} />
          </Section>
          <Section title="Case Details" stacked>
            <LongDetail label="Mechanism of Injury / Nature of Illness" value={record.mechanism} />
            <LongDetail label="Scene Description" value={record.sceneDescription} />
            <LongDetail label="During Transport" value={record.duringTransport} />
            <LongDetail label="Hospital Handover" value={record.hospitalHandover} />
            <LongDetail label="Outcome" value={record.outcome} />
          </Section>
        </div>
        <aside className="space-y-4">
          {record.photos?.length ? (
            <div className="bc-card overflow-hidden p-3 space-y-3">
              {record.photos.map((photo, index) => (
                <img key={`${photo}-${index}`} src={photo} alt={`Case photo ${index + 1}`} className="block w-full rounded-md object-cover" />
              ))}
              <div className="border-t border-border pt-3 text-xs text-muted-foreground">Attached photos</div>
            </div>
          ) : record.photo ? (
            <div className="bc-card overflow-hidden">
              <img src={record.photo} alt="Case photo" className="block w-full object-cover" />
              <div className="border-t border-border p-3 text-xs text-muted-foreground">Attached photo</div>
            </div>
          ) : null}
          <div className="bc-card p-4 text-xs text-muted-foreground space-y-2">
            <div><span className="font-medium text-foreground">Created:</span> {new Date(record.createdAt).toLocaleString()}</div>
            <div><span className="font-medium text-foreground">Updated:</span> {new Date(record.updatedAt).toLocaleString()}</div>
            <div className="font-mono break-all opacity-70">{record.id}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children, stacked }: { title: string; children: React.ReactNode; stacked?: boolean }) {
  return (
    <section>
      <h2 className="bc-section-title">{title}</h2>
      <dl className={stacked ? "space-y-4" : "grid gap-3 sm:grid-cols-2"}>{children}</dl>
    </section>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}
function LongDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap rounded-md bg-secondary/60 p-3 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}
