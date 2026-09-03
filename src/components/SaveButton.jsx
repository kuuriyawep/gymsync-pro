import React, { useState } from "react";
import { Loader2, Check } from "lucide-react";

export default function SaveButton({ onSave, label = "Save changes", successLabel = "Saved", className = "px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90" }) {
  const [status, setStatus] = useState("idle");

  const click = async () => {
    if (status === "saving") return;
    setStatus("saving");
    try {
      await new Promise((r) => setTimeout(r, 700));
      await onSave?.();
      setStatus("done");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <button onClick={click} disabled={status === "saving"} className={`inline-flex items-center gap-2 disabled:opacity-80 ${className}`}>
      {status === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
      {status === "done" && <Check className="w-4 h-4" />}
      {status === "saving" ? "Saving..." : status === "done" ? successLabel : label}
    </button>
  );
}