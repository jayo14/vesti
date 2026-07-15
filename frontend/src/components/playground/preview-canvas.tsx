export default function PreviewCanvas() {
  return (
    <div className="flex aspect-[3/4] items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50">
      <div className="text-center">
        <svg
          className="mx-auto h-10 w-10 text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.41a2.25 2.25 0 0 1 3.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z"
          />
        </svg>
        <p className="mt-2 text-sm text-neutral-400">
          Your generated garment will appear here
        </p>
      </div>
    </div>
  );
}
