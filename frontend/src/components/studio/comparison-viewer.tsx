export default function ComparisonViewer() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
        <div className="mb-2 aspect-[3/4] rounded-md bg-neutral-100" />
        <p className="text-xs text-neutral-500">Original</p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
        <div className="mb-2 aspect-[3/4] rounded-md bg-neutral-100" />
        <p className="text-xs text-neutral-500">Generated</p>
      </div>
    </div>
  );
}
