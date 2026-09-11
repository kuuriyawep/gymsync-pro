import React, { useRef, useState } from "react";
import { Image as ImageIcon, MapPin, Building2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

export default function GymProfileSetup({ value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange({ logoUrl: file_url });
    } catch (_) {}
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-2">Gym logo</p>
        <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-2xl border border-dashed border-black/25 flex items-center justify-center overflow-hidden bg-black/[0.02]">
            {value.logoUrl ? <Image src={value.logoUrl} className="w-full h-full" fittingType="fit" /> : uploading ? <Loader2 className="w-5 h-5 animate-spin text-black/40" /> : <ImageIcon className="w-5 h-5 text-black/40" />}
          </div>
          <div className="text-left"><p className="text-sm font-medium">{value.logoUrl ? "Change logo" : "Upload logo"}</p><p className="text-xs text-black/50">PNG or JPG, square</p></div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-2 block">Gym name</label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
          <input value={value.name || ""} onChange={(e) => onChange({ name: e.target.value })} placeholder="Olympic Gym" className="w-full pl-10 pr-3 py-3 rounded-xl border border-black/15 text-sm outline-none focus:border-black" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-2 block">Primary location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
          <input value={value.location || ""} onChange={(e) => onChange({ location: e.target.value })} placeholder="Mogadishu, Somalia" className="w-full pl-10 pr-3 py-3 rounded-xl border border-black/15 text-sm outline-none focus:border-black" />
        </div>
      </div>
    </div>
  );
}