import Link from "next/link";
import PromptInput from "@/components/playground/prompt-input";
import PromptHistory from "@/components/playground/prompt-history";
import PreviewCanvas from "@/components/playground/preview-canvas";
import ComponentControlPanel from "@/components/playground/component-control-panel";
import ImageSourcePicker from "@/components/playground/image-source-picker";

export default function PlaygroundSection() {
  return (
    <section className="bg-neutral-50 py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                AI Playground
              </h1>
              <p className="mt-2 text-neutral-600">
                Design, edit, and visualise garments with generative AI.
              </p>
            </div>
            <Link
              href="/playground"
              className="hidden text-sm font-medium text-brand-600 hover:underline sm:block"
            >
              Open Playground &rarr;
            </Link>
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <PreviewCanvas />
            <PromptInput />
          </div>
          <div className="space-y-6">
            <ImageSourcePicker />
            <ComponentControlPanel />
            <PromptHistory />
          </div>
        </div>
      </div>
    </section>
  );
}
