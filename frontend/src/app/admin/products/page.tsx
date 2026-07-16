import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProductsSection } from "@/components/admin/admin-products-section";

export default function AdminProductsPage() {
  return (
    <AdminShell title="Product moderation" subtitle="Review marketplace product submissions before publication.">
      <AdminProductsSection />
    </AdminShell>
  );
}
