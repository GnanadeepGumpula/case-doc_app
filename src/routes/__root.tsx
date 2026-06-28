import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import "../styles.css";
import DeveloperBadge from "../components/DeveloperBadge";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CaseDoc Matrix | Gnanadeep" },
    ],
    link: [
      { rel: "icon", type: "image/png", href: "/logo.png" }, // Global Logo Icon mapping
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body
        className="bg-background text-foreground antialiased selection:bg-primary/20"
        suppressHydrationWarning
      >
        <ClientOnly>
          <Outlet />
          <DeveloperBadge />
        </ClientOnly>
        <Scripts />
      </body>
    </html>
  );
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}
