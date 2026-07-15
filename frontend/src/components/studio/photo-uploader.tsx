export default function PhotoUploader() {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-neutral-700">Reference Photo</h3>
      <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 transition hover:border-brand-400 hover:bg-brand-50">
        <div className="text-center">
          <svg className="mx-auto h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <p className="mt-1 text-xs text-neutral-500">Upload</p>
        </div>
        <input type="file" accept="image/*" className="hidden" />
      </label>
    </div>
  );
}
