import { AdminShell } from "@/components/admin/admin-shell";
import { AdminOverviewSection } from "@/components/admin/admin-overview-section";

export default function AdminPage() {
  return (
    <AdminShell title="Overview" subtitle="Platform snapshot — queues, revenue, AI health, and growth.">
      <AdminOverviewSection />
    </AdminShell>
  );
}
