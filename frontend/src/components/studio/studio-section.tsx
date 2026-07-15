import GenerationPanel from "./generation-panel";
import MaterialPicker from "./material-picker";
import PhotoUploader from "./photo-uploader";
import GarmentSelector from "./garment-selector";
import ComparisonViewer from "./comparison-viewer";
import ActionBar from "./action-bar";

export default function StudioSection() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-neutral-900">Design Studio</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <ComparisonViewer />
        <div className="space-y-6">
          <GarmentSelector />
          <MaterialPicker />
          <PhotoUploader />
          <GenerationPanel />
          <ActionBar />
        </div>
      </div>
    </div>
  );
}
