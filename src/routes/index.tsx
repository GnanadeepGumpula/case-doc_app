import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Automatically forwards the user directly to your login window
    throw redirect({ to: "/login" });
  },
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold text-brand mb-1">CaseDoc Matrix</h1>
      <p className="text-muted-foreground text-xs mb-4">Developed by Gnanadeep Gumpula</p>
    </div>
  );
}
