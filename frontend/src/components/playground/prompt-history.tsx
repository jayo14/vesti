const history = [
  "A cropped denim jacket with patchwork details",
  "Wide-leg linen trousers in beige",
  "An oversized knit sweater in oatmeal",
];

export default function PromptHistory() {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-neutral-700">Recent Prompts</h3>
      <ul className="space-y-1.5">
        {history.map((item, i) => (
          <li
            key={i}
            className="cursor-pointer rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
