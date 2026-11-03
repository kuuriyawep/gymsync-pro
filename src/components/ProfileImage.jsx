import React from "react";
import { Image } from "@/components/ui/image";

/**
 * Avatar with a photo or initials fallback.
 * Colours come from theme tokens so the same avatar reads correctly on light
 * and dark surfaces; `dark` is kept for call-site compatibility.
 */
export default function ProfileImage({ src, alt = "", fallback, className = "w-10 h-10", shape = "circle" }) {
  return (
    <div className={`${className} ${shape === "circle" ? "rounded-full" : "rounded-xl"} bg-accent text-foreground relative shrink-0 overflow-hidden flex items-center justify-center font-semibold`}>
      {src ? <Image src={src} alt={alt} className="w-full h-full" fittingType="cover" /> : <span>{fallback}</span>}
    </div>
  );
}