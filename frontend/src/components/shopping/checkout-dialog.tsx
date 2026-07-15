export default function CheckoutDialog() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">Checkout</h2>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Subtotal</span>
          <span className="font-medium text-neutral-900">$99</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Shipping</span>
          <span className="font-medium text-neutral-900">$5</span>
        </div>
        <div className="border-t pt-3">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-neutral-900">Total</span>
            <span className="text-neutral-900">$104</span>
          </div>
        </div>
        <button className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
          Place Order
        </button>
      </div>
    </div>
  );
}
