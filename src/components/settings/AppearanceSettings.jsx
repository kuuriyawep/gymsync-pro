import React from "react";
import { Check, Moon, Sun } from "lucide-react";
import useTheme from "@/hooks/use-theme";

const choices = [
  { id: "light", label: "Light", description: "Bright background and dark text", icon: Sun },
  { id: "dark", label: "Dark", description: "Dark background and light text", icon: Moon },
];

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="bg-card border border-border rounded-xl p-5 md:p-6 space-y-3">
      <p className="text-sm text-muted-foreground">Choose how GymSync looks on this device.</p>
      {choices.map((choice) => (
        <button key={choice.id} type="button" onClick={() => setTheme(choice.id)} className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left text-foreground transition-colors ${theme === choice.id ? "border-foreground bg-muted" : "border-border hover:bg-muted/60"}`}>
          <span className="w-10 h-10 rounded-lg bg-background flex items-center justify-center"><choice.icon className="w-5 h-5" /></span>
          <span className="flex-1"><span className="block text-sm font-semibold">{choice.label}</span><span className="block text-xs text-muted-foreground mt-0.5">{choice.description}</span></span>
          {theme === choice.id && <Check className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );
}