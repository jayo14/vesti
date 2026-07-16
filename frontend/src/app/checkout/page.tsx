"use client";

import { useSearchParams } from "next/navigation";
import { CheckoutDialog } from "@/components/shopping/checkout-dialog";

export default function CheckoutPage() {
  const searchParams = useSearchParams();

  return <CheckoutDialog open={true} onOpenChange={() => {}} />;
}
