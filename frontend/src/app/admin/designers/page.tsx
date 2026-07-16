import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDesignersSection } from "@/components/admin/admin-designers-section";

export default function AdminDesignersPage() {
  return (
    <AdminShell title="Designer applications" subtitle="Review and approve or reject pending designer applications.">
      <AdminDesignersSection />
    </AdminShell>
  );
}
