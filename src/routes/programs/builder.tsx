import { createFileRoute } from "@tanstack/react-router";
import { ProgramBuilder } from "@/components/ProgramBuilder";
import { VipLocked } from "@/components/VipLocked";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/programs/builder")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: BuilderPage,
  head: () => ({ meta: [{ title: "Program builder — GRAVITACIO" }] }),
});

function BuilderPage() {
  const { id } = Route.useSearch();
  const { user, loading } = useAuth();

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center text-muted-foreground">
        Please log in to build a program.
      </div>
    );
  }

  if (user && !user.isVip) {
    return <VipLocked />;
  }

  return <ProgramBuilder editId={id} />;
}
