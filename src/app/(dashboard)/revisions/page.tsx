import { requireAuth } from "@/lib/session";
import { getRevisionsForUser, getRevisionMetrics } from "@/server/repositories/revision-repository";
import { getUserCategories } from "@/server/repositories/category-repository";
import { RevisionListClient } from "@/features/revisions/revision-list-client";

export default async function RevisionsPage() {
  const { userId } = await requireAuth();

  const [revisions, categories, metrics] = await Promise.all([
    getRevisionsForUser(userId, "all"),
    getUserCategories(userId),
    getRevisionMetrics(userId),
  ]);

  return (
    <RevisionListClient
      initialRevisions={revisions}
      categories={categories}
      metrics={metrics}
    />
  );
}
