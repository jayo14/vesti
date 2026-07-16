import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPayoutsSection } from "@/components/admin/admin-payouts-section";

export default function AdminPayoutsPage() {
  return (
    <AdminShell title="Payouts" subtitle="Manage designer payout requests — process, approve, or reject.">
      <AdminPayoutsSection />
    </AdminShell>
  );
}
