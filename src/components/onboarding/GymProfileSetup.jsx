import React, { useRef, useState } from "react";
import { Image as ImageIcon, MapPin, Building2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

const field = "w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:border-ring";
const caption = "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block";

export default function GymProfileSetup({ value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Choose a valid image file."); e.target.value = ""; return; }
    setUploadError("");
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange({ logoUrl: file_url });
    } catch (_) {
      setUploadError("Logo upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className={caption}>Gym logo</p>
        <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-3 text-left">
          <div className="w-20 h-20 rounded-2xl border border-dashed border-border flex items-center justify-center overflow-hidden bg-muted shrink-0">
            {value.logoUrl ? <Image src={value.logoUrl} className="w-full h-full" fittingType="fit" /> : uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div className="text-left"><p className="text-sm font-medium">{value.logoUrl ? "Change logo" : "Upload logo"}</p><p className="text-xs text-muted-foreground">{uploadError || "PNG or JPG, square"}</p></div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <div>
        <label className={caption}>Gym name</label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={value.name || ""} onChange={(e) => onChange({ name: e.target.value })} placeholder="Olympic Gym" className={field} />
        </div>
      </div>
      <div>
        <label className={caption}>Primary location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={value.location || ""} onChange={(e) => onChange({ location: e.target.value })} placeholder="Mogadishu, Somalia" className={field} />
        </div>
      </div>
    </div>
  );
}