export default function ActionBar() {
  return (
    <div className="flex gap-3">
      <button className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
        Generate
      </button>
      <button className="flex-1 rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100">
        Reset
      </button>
    </div>
  );
}
