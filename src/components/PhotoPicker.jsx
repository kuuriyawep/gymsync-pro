import React, { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

export default function PhotoPicker({ value, onChange, onRemove, shape = "circle", size = "w-16 h-16", placeholder, hint = "JPG or PNG." }) {
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);
  const round = shape === "circle";

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange?.(file_url);
    } catch (_) {}
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`relative ${size} ${round ? "rounded-full" : "rounded-2xl"} border border-dashed border-black/25 flex items-center justify-center overflow-hidden bg-black/[0.02] hover:bg-black/5 transition-colors shrink-0`}
      >
        {value ? (
          <Image src={value} className="w-full h-full" fittingType="fill" />
        ) : uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-black/40" />
        ) : placeholder ? (
          <span className="text-sm font-semibold text-black/60">{placeholder}</span>
        ) : (
          <Camera className="w-5 h-5 text-black/40" />
        )}
      </button>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => ref.current?.click()} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">
            {value ? "Change photo" : "Add photo"}
          </button>
          {value && onRemove && (
            <button type="button" onClick={onRemove} className="px-3 py-1.5 text-sm font-medium rounded-lg text-black/60 hover:bg-black/5">
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-black/40 mt-1.5">{hint}</p>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}