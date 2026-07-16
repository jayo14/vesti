import { AdminShell } from "@/components/admin/admin-shell";
import { AdminUsersSection } from "@/components/admin/admin-users-section";

export default function AdminUsersPage() {
  return (
    <AdminShell title="Users" subtitle="Manage platform users — toggle designer and staff roles.">
      <AdminUsersSection />
    </AdminShell>
  );
}
