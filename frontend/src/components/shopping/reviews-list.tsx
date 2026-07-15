import StarRating from "./star-rating";

const reviews = [
  { user: "Alex", rating: 5, text: "Absolutely love it! The fit is perfect." },
  { user: "Jordan", rating: 4, text: "Great quality, runs slightly large." },
];

export default function ReviewsList() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-neutral-700">Reviews</h3>
      {reviews.map((r, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-900">{r.user}</span>
            <StarRating rating={r.rating} />
          </div>
          <p className="mt-1 text-sm text-neutral-600">{r.text}</p>
        </div>
      ))}
    </div>
  );
}
