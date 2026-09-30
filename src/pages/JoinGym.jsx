import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, KeyRound, ArrowRight, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { joinGym } from "@/lib/memberPortalStore";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import PhoneNumberField from "@/components/PhoneNumberField";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const inputCls = "w-full px-3 py-3 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black";

export default function JoinGym() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth, reloadRole } = useAuth();
  // "checking" while auth state is still loading, then either "account"
  // (no session — a first-time member has to create one before the
  // join-gym function can even be called) or "form" (already signed in,
  // e.g. via MemberDataState's "link your membership" redirect).
  const [step, setStep] = useState("checking");
  const [phone, setPhone] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoadingAuth) return;
    setStep((current) => (current === "checking" ? (isAuthenticated ? "form" : "account") : current));
  }, [isLoadingAuth, isAuthenticated]);

  const createAccount = async (event) => {
    event.preventDefault();
    setError("");
    setStep("creatingAccount");
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password });
      if (signUpError) throw signUpError;
      setStep("otp");
    } catch (err) {
      setError(err.message || "Could not create your account");
      setStep("account");
    }
  };

  const verifyOtp = async () => {
    setError("");
    setStep("verifyingOtp");
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: otpCode, type: "signup" });
      if (verifyError) throw verifyError;
      // verifyOtp establishes the session directly — AuthContext's
      // onAuthStateChange picks it up; we just move to the phone/code step.
      setStep("form");
    } catch (err) {
      setError(err.message || "Invalid verification code");
      setStep("otp");
    }
  };

  const resendOtp = async () => {
    setError("");
    try {
      const { error: resendError } = await supabase.auth.resend({ type: "signup", email: email.trim().toLowerCase() });
      if (resendError) throw resendError;
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    setError("");
    setStep("verifying");
    try {
      await joinGym(phone.trim(), joinToken.trim());
      await reloadRole();
      setStep("success");
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Verification failed");
      setStep("error");
    }
  };

  return <div className="min-h-screen bg-white text-black flex flex-col"><header className="h-14 flex items-center px-4 border-b border-black/10"><button onClick={() => navigate("/login")} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5" /></button><div className="flex-1 flex justify-center items-center gap-2"><div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center"><Dumbbell className="w-4 h-4 text-white" /></div><b>GymSync</b></div><div className="w-9" /></header><div className="flex-1 flex items-center justify-center px-5 py-8"><div className="w-full max-w-md">
    <AnimatePresence mode="wait">
      {step === "checking" && <div className="text-center py-10"><Loader2 className="w-10 h-10 mx-auto animate-spin" /></div>}

      {step === "account" && <motion.div key="account" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-black/50 mt-1 mb-6">First, set up your login — then we'll verify your gym membership.</p>
        {error && <p className="mb-4 p-3 bg-black/5 rounded-lg text-sm">{error}</p>}
        <SocialAuthButtons redirectTo="/join-gym" onError={setError} />
        <div className="relative mb-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/10" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-black/40">or</span></div></div>
        <form onSubmit={createAccount} className="space-y-4">
          <label className="block text-sm font-medium">Email<div className="relative mt-1.5"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-black/40" /><input type="email" autoComplete="email" className={`${inputCls} pl-10`} value={email} onChange={(e) => setEmail(e.target.value)} required /></div></label>
          <label className="block text-sm font-medium">Password<div className="relative mt-1.5"><Lock className="absolute left-3 top-3.5 w-4 h-4 text-black/40" /><input type="password" autoComplete="new-password" className={`${inputCls} pl-10`} value={password} onChange={(e) => setPassword(e.target.value)} required /></div></label>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-black text-white text-sm font-medium">Create account <ArrowRight className="w-4 h-4" /></button>
        </form>
      </motion.div>}

      {step === "creatingAccount" && <div className="text-center py-10"><Loader2 className="w-10 h-10 mx-auto animate-spin" /><p className="text-sm mt-4">Creating your account…</p></div>}

      {step === "otp" && <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-sm text-black/50 mt-1 mb-6">We sent a code to {email}</p>
        {error && <p className="mb-4 p-3 bg-black/5 rounded-lg text-sm">{error}</p>}
        <div className="flex justify-center mb-6"><InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code"><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup></InputOTP></div>
        <button onClick={verifyOtp} disabled={otpCode.length < 6} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-black text-white text-sm font-medium disabled:opacity-50">Verify</button>
        <p className="text-center text-sm text-black/50 mt-4">Didn't receive the code? <button onClick={resendOtp} className="font-medium underline">Resend</button></p>
      </motion.div>}

      {step === "verifyingOtp" && <div className="text-center py-10"><Loader2 className="w-10 h-10 mx-auto animate-spin" /><p className="text-sm mt-4">Verifying…</p></div>}

      {step === "form" && <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><h1 className="text-2xl font-bold">Join your gym</h1><p className="text-sm text-black/50 mt-1 mb-6">Enter your phone number and the join code your gym gave you.</p>{error && <p className="mb-4 p-3 bg-black/5 rounded-lg text-sm">{error}</p>}<form onSubmit={verify} className="space-y-4"><label className="block text-sm font-medium">Registered phone number<div className="relative mt-1.5"><PhoneNumberField value={phone} onChange={setPhone} /></div></label><label className="block text-sm font-medium">Join code<div className="relative mt-1.5"><KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-black/40" /><input className={`${inputCls} pl-10`} value={joinToken} onChange={(e) => setJoinToken(e.target.value)} required /></div></label><button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-black text-white text-sm font-medium">Verify information <ArrowRight className="w-4 h-4" /></button></form></motion.div>}

      {step === "verifying" && <div className="text-center py-10"><Loader2 className="w-10 h-10 mx-auto animate-spin" /><p className="text-sm mt-4">Verifying your information…</p></div>}

      {step === "success" && <div className="text-center"><CheckCircle2 className="w-16 h-16 mx-auto mb-4" /><h1 className="text-2xl font-bold">Membership verified</h1><p className="text-sm text-black/50 mt-2 mb-6">Your exact membership information is now linked.</p><button onClick={() => navigate("/member")} className="w-full px-4 py-3 rounded-lg bg-black text-white">Continue to member app</button></div>}

      {step === "error" && <div className="text-center"><AlertCircle className="w-16 h-16 mx-auto mb-4 text-black/50" /><h1 className="text-2xl font-bold">We couldn't verify your information</h1><p className="text-sm text-black/50 mt-2 mb-6">{error}</p><button onClick={() => setStep("form")} className="w-full px-4 py-3 rounded-lg bg-black text-white">Try again</button></div>}
    </AnimatePresence>
  </div></div></div>;
}
