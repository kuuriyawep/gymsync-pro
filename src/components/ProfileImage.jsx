import React from "react";
import { Image } from "@/components/ui/image";

export default function ProfileImage({ src, alt = "", fallback, className = "w-10 h-10", shape = "circle", dark = false }) {
  return (
    <div className={`${className} ${shape === "circle" ? "rounded-full" : "rounded-xl"} ${dark ? "bg-black text-white" : "bg-black/5 text-black"} relative shrink-0 overflow-hidden flex items-center justify-center font-semibold`}>
      {src ? <Image src={src} alt={alt} className="w-full h-full" fittingType="cover" /> : <span>{fallback}</span>}
    </div>
  );
}