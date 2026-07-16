import { AdminShell } from "@/components/admin/admin-shell";
import { AdminGenerationsSection } from "@/components/admin/admin-generations-section";

export default function AdminGenerationsPage() {
  return (
    <AdminShell title="AI health" subtitle="Generation success rates, failure reasons, and latency metrics.">
      <AdminGenerationsSection />
    </AdminShell>
  );
}
