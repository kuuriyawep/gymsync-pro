import React, { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, RotateCcw, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

const actionBtn = "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50";

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
      // Public storage: a member/gym photo must render in the member portal and
      // on any surface that only holds the URL, without a signed request.
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
        onClick={() => (pendingFile ? null : galleryRef.current?.click())}
        className={`relative ${size} ${round ? "rounded-full" : "rounded-2xl"} flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-border bg-accent transition-colors hover:bg-accent/80`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Selected photo preview" className="h-full w-full object-cover" />
        ) : value ? (
          <Image src={value} alt="Selected profile photo" className="h-full w-full object-cover" fittingType="cover" />
        ) : uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : placeholder ? (
          <span className="text-sm font-semibold text-muted-foreground">{placeholder}</span>
        ) : (
          <Camera className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <div className="min-w-0">
        {pendingFile ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={uploading} onClick={usePhoto} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-emerald-950 disabled:opacity-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Use photo</button>
            <button type="button" disabled={uploading} onClick={() => setPendingFile(null)} className={actionBtn}><RotateCcw className="h-4 w-4" /> Retake</button>
            <button type="button" disabled={uploading} onClick={() => setPendingFile(null)} aria-label="Cancel photo selection" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={uploading} onClick={() => galleryRef.current?.click()} className={actionBtn}><ImagePlus className="h-4 w-4" /> Gallery</button>
            <button type="button" disabled={uploading} onClick={() => cameraRef.current?.click()} className={actionBtn}><Camera className="h-4 w-4" /> Camera</button>
            {value && onRemove && <button type="button" onClick={onRemove} className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent">Remove</button>}
          </div>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">{uploadError || (pendingFile ? "Check the crop, then choose Use photo or Retake." : hint)}</p>
      </div>
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
    </div>
  );
}