import { createFileRoute, useRouter } from "@tanstack/react-router";
import { CaseForm } from "@/components/CaseForm";
import { emptyCase, upsertCase, type CaseRecord } from "@/lib/cases";

export const Route = createFileRoute("/_app/cases/new")({
  head: () => ({ meta: [{ title: "New Case · Best Case Documentation" }] }),
  component: NewCase,
});

function NewCase() {
  const router = useRouter();
  const initial = emptyCase();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Case</h1>
        <p className="text-sm text-muted-foreground">Document a new emergency response.</p>
      </div>
      <CaseForm
        initial={initial}
        onSubmit={(c: CaseRecord) => {
          upsertCase({ ...c, updatedAt: Date.now() });
          router.navigate({ to: "/cases/$id", params: { id: c.id } });
        }}
        onCancel={() => router.navigate({ to: "/cases" })}
        submitLabel="Save Case"
      />
    </div>
  );
}
