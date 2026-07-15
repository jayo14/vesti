import Link from "next/link";
import WardrobeGrid from "@/components/wardrobe/wardrobe-grid";
import WardrobeUploader from "@/components/wardrobe/wardrobe-uploader";
import OutfitRecommender from "@/components/wardrobe/outfit-recommender";

export default function WardrobeSection() {
  return (
    <section className="bg-neutral-50 py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              Your Wardrobe
            </h1>
            <p className="mt-2 text-neutral-600">
              Upload, organise, and let AI style you.
            </p>
          </div>
          <Link
            href="/wardrobe"
            className="hidden text-sm font-medium text-brand-600 hover:underline sm:block"
          >
            Open Wardrobe &rarr;
          </Link>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="space-y-8">
            <WardrobeUploader />
            <WardrobeGrid />
          </div>
          <div>
            <OutfitRecommender />
          </div>
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/wardrobe"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Open Wardrobe &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
