"use client";

import { useParams } from "next/navigation";
import { ProductPageSection } from "@/components/sections/product-page-section";

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();

  return <ProductPageSection productId={params.productId} />;
}
