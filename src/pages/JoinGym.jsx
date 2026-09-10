import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Phone, User, ArrowRight, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { supabase } from "@/lib/supabaseClient";
import { signInWithProvider } from "@/lib/supabaseAuth";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";


const inputCls = "w-full px-3 py-3 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";

export default function JoinGym() {
  const navigate = useNavigate();
  const [step, setStep] = useState("form"); // form | verifying | success | error
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    if (!isAuthenticated) { setError("Sign in first so we can securely link your membership to your account."); return; }
    setStep("verifying");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("join-gym", { body: { phone: phone.trim(), full_name: name.trim() } });
      if (invokeError || !data?.success) throw new Error("We couldn't verify those details. Check them and try again.");
      setStep("success");
    } catch (err) { setError(err.message || "Verification failed"); setStep("error"); }
  };

  const continueWithGoogle = async () => {
    try { await signInWithProvider("google", window.location.origin + "/join-gym"); }
    catch (err) { setError(err.message || "Google sign in is unavailable"); }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <header className="h-14 flex items-center px-4 border-b border-black/10" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <button onClick={() => navigate("/login")} className="p-2 -ml-2 rounded-lg hover:bg-black/5"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1 text-center flex items-center justify-center gap-2"><div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center"><Dumbbell className="w-4 h-4 text-white" /></div><span className="font-heading font-bold tracking-tight">GymSync</span></div>
        <div className="w-9" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* FORM */}
            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h1 className="text-2xl font-heading font-bold tracking-tight">Join your gym</h1>
                <p className="text-sm text-black/50 mt-1 mb-6">Enter the phone number and full name registered at your gym so we can verify your membership.</p>
                {!isAuthenticated && <div className="mb-5 p-4 rounded-xl bg-black/[0.03] border border-black/10"><p className="text-sm font-semibold">Sign in to link your membership</p><p className="text-xs text-black/50 mt-1 mb-3">Your gym membership can only be linked to an authenticated account.</p><button type="button" onClick={continueWithGoogle} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5"><GoogleIcon className="w-5 h-5" /> Continue with Google</button></div>}
                {error && <div className="mb-4 p-3 rounded-lg bg-black/5 text-sm text-black/70">{error}</div>}
                <form onSubmit={verify} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Registered phone number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                      <input className={`${inputCls} pl-10`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0101" inputMode="tel" autoComplete="tel" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                      <input className={`${inputCls} pl-10`} value={name} onChange={(e) => setName(e.target.value)} placeholder="As registered at your gym" autoComplete="name" required />
                    </div>
                  </div>
                  <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Verify information <ArrowRight className="w-4 h-4" /></button>
                </form>
                <p className="text-xs text-black/40 text-center mt-4">Don't have a membership yet? Please visit your gym to register first.</p>
              </motion.div>
            )}

            {/* VERIFYING */}
            {step === "verifying" && (
              <motion.div key="v" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10">
                <Loader2 className="w-10 h-10 mx-auto animate-spin" />
                <p className="text-sm text-black/60 mt-4">Verifying your information…</p>
              </motion.div>
            )}

            {/* SUCCESS */}
            {step === "success" && (
              <motion.div key="s" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
                <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8" /></div>
                <h1 className="text-2xl font-heading font-bold tracking-tight">Membership verified</h1>
                <p className="text-sm text-black/50 mt-1 mb-6">Your membership has been securely linked to your account. You can now access the member app.</p>
                <button onClick={() => navigate("/member")} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
                  Continue to member app
                </button>
                <p className="text-xs text-black/40 mt-4">This links your Google account to your existing member profile. It does not create a new membership.</p>
              </motion.div>
            )}

            {/* ERROR */}
            {step === "error" && (
              <motion.div key="e" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
                <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-black/50" /></div>
                <h1 className="text-2xl font-heading font-bold tracking-tight">We couldn't verify your information</h1>
                <p className="text-sm text-black/50 mt-1 mb-6">The phone number and name you entered don't match a registered membership at this gym. Please check your details and try again, or contact your gym's front desk.</p>
                <button onClick={() => { setStep("form"); setPhone(""); setName(""); }} className="w-full px-4 py-3 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Try again</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}