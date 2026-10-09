import React, { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, RotateCcw, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

export default function PhotoPicker({ value, onChange, onRemove, shape = "circle", size = "w-16 h-16", placeholder, hint = "JPG or PNG." }) {
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const round = shape === "circle";

  useEffect(() => {
    if (!pendingFile) { setPreviewUrl(""); return; }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Choose a valid image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError("Choose an image smaller than 10 MB."); return; }
    setUploadError("");
    setPendingFile(file);
  };

  const usePhoto = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setUploadError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: pendingFile });
      onChange?.(file_url);
      setPendingFile(null);
    } catch (_) {
      setUploadError("Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`relative ${size} ${round ? "rounded-full" : "rounded-2xl"} border border-dashed border-black/25 flex items-center justify-center overflow-hidden bg-black/[0.02] hover:bg-black/5 transition-colors shrink-0`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Selected photo preview" className="w-full h-full object-cover" />
        ) : value ? (
          <Image src={value} alt="Selected profile photo" className="w-full h-full object-cover" fittingType="cover" />
        ) : uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-black/40" />
        ) : placeholder ? (
          <span className="text-sm font-semibold text-black/60">{placeholder}</span>
        ) : (
          <Camera className="w-5 h-5 text-black/40" />
        )}
      </button>
      <div className="min-w-0">
        {pendingFile ? (
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" disabled={uploading} onClick={usePhoto} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-black text-white disabled:opacity-50">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Use photo</button>
            <button type="button" disabled={uploading} onClick={() => setPendingFile(null)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5 disabled:opacity-50"><RotateCcw className="w-4 h-4" /> Retake</button>
            <button type="button" disabled={uploading} onClick={() => setPendingFile(null)} aria-label="Cancel photo selection" className="p-1.5 rounded-lg hover:bg-black/5 disabled:opacity-50"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" disabled={uploading} onClick={() => galleryRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5 disabled:opacity-50"><ImagePlus className="w-4 h-4" /> Gallery</button>
            <button type="button" disabled={uploading} onClick={() => cameraRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5 disabled:opacity-50"><Camera className="w-4 h-4" /> Camera</button>
            {value && onRemove && <button type="button" onClick={onRemove} className="px-3 py-1.5 text-sm font-medium rounded-lg text-black/60 hover:bg-black/5">Remove</button>}
          </div>
        )}
        <p className="text-xs text-black/40 mt-1.5">{uploadError || (pendingFile ? "Check the crop, then choose Use photo or Retake." : hint)}</p>
      </div>
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
    </div>
  );
}