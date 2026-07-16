import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDisputesSection } from "@/components/admin/admin-disputes-section";

export default function AdminDisputesPage() {
  return (
    <AdminShell title="Disputes" subtitle="Customer disputes — review, resolve, or reject.">
      <AdminDisputesSection />
    </AdminShell>
  );
}
