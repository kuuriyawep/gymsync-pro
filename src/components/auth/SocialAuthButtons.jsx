import React, { useEffect, useState } from "react";
import { Apple, Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { getSocialProviders, signInWithProvider } from "@/lib/supabaseAuth";

export default function SocialAuthButtons({ redirectTo, onError }) {
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState("");
  useEffect(() => { getSocialProviders().then(setProviders).catch(() => setProviders({ google: false, apple: false })); }, []);
  const connect = async (provider) => {
    if (!providers?.[provider]) { onError(`${provider === "google" ? "Google" : "Apple"} sign-in is not enabled yet.`); return; }
    setLoading(provider); onError("");
    try { await signInWithProvider(provider, redirectTo); }
    catch (error) { onError(error.message || `${provider} sign-in is unavailable`); setLoading(""); }
  };
  const button = (provider, label, Icon) => <button type="button" onClick={() => connect(provider)} disabled={!providers || Boolean(loading)} className="w-full h-12 flex items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium disabled:opacity-60">{loading === provider ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}Continue with {label}</button>;
  return <div className="grid gap-3 mb-6">{button("google", "Google", GoogleIcon)}{button("apple", "Apple", Apple)}</div>;
}