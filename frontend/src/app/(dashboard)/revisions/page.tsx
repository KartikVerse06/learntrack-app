import { requireAuth } from "@/lib/session";
import { getRevisionsApi, getRevisionMetricsApi } from "@/lib/api/revisions";
import { getCategoriesApi } from "@/lib/api/categories";
import { RevisionListClient } from "@/features/revisions/revision-list-client";

export default async function RevisionsPage() {
  const { token } = await requireAuth();

  const [revRes, catRes, metRes] = await Promise.all([
    getRevisionsApi("all", undefined, token),
    getCategoriesApi(token),
    getRevisionMetricsApi(token),
  ]);

  const revisions = revRes.success && revRes.data ? revRes.data : [];
  const categories = catRes.success && catRes.data ? catRes.data : [];
  const metrics = metRes.success && metRes.data ? metRes.data : {
    dueToday: 0,
    overdue: 0,
    totalDue: 0,
    upcoming: 0,
    completed: 0,
    masteredTopicsCount: 0,
  };

  return (
    <RevisionListClient
      initialRevisions={revisions}
      categories={categories}
      metrics={metrics}
    />
  );
}
