import { createFileRoute, useRouter } from "@tanstack/react-router";
import { CaseForm } from "@/components/CaseForm";
import { checkCaseLimit, emptyCase, upsertCase, type CaseRecord } from "@/lib/cases";
import { toast } from "sonner";

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
        onSubmit={async (c: CaseRecord) => {
          const { reached } = await checkCaseLimit();
          if (reached) {
            toast.error("You have reached the 24-case limit. Delete older cases or upgrade to continue.");
            return;
          }
          try {
            const saved = await upsertCase({ ...c, id: c.id || crypto.randomUUID(), updatedAt: Date.now() });
            toast.success("Case saved successfully.");
            router.navigate({ to: "/cases/$id", params: { id: saved.id } });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to save case.";
            toast.error(message);
          }
        }}
        onCancel={() => router.navigate({ to: "/cases" })}
        submitLabel="Save Case"
      />
    </div>
  );
}
