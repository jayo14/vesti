import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTransactionsSection } from "@/components/admin/admin-transactions-section";

export default function AdminTransactionsPage() {
  return (
    <AdminShell title="Transactions" subtitle="All payment transactions across the platform.">
      <AdminTransactionsSection />
    </AdminShell>
  );
}
