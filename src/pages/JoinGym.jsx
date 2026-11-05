import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, User, ArrowRight, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { joinGym } from "@/lib/memberPortalStore";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import PhoneNumberField from "@/components/PhoneNumberField";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { validateMemberLink } from "@/lib/linkVerification";

const inputCls = "w-full px-3 py-3 rounded-lg border border-border bg-card text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring";
const primary = "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90";

export default function JoinGym() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth, reloadRole } = useAuth();
  // "checking" while auth state is still loading, then either "account"
  // (no session — a first-time member has to create one before the
  // join-gym function can even be called) or "form" (already signed in,
  // e.g. via MemberDataState's "link your membership" redirect).
  const [step, setStep] = useState("checking");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (isLoadingAuth) return;
    setStep((current) => (current === "checking" ? (isAuthenticated ? "form" : "account") : current));
  }, [isLoadingAuth, isAuthenticated]);

  const createAccount = async (event) => {
    event.preventDefault();
    setError("");
    setStep("creatingAccount");
    try {
      const normalizedEmail = email.trim().toLowerCase();
      // Use Supabase's email OTP flow here. The previous implementation used
      // signUp(), while the UI expected a 6-digit OTP from the confirmation
      // email. signUp() normally uses the Confirm signup template/link, so the
      // two flows did not match.
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
        },
      });
      if (otpError) throw otpError;
      setStep("otp");
    } catch (err) {
      setError(err.message || "Could not send your verification code");
      setStep("account");
    }
  };

  const verifyOtp = async () => {
    setError("");
    setStep("verifyingOtp");
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otpCode,
        type: "email",
      });
      // A wrong/expired code is the only reason to go back to the code screen.
      // Sending the member there after a successful verification would ask them
      // to reuse a code that has already been consumed.
      if (verifyError) {
        setError(verifyError.message || "Invalid verification code");
        setStep("otp");
        return;
      }

      // OTP verification creates the authenticated session. Now attach the
      // password the member chose so normal email/password login works later.
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      setNotice(passwordError ? "Your email is verified, but the password could not be saved. You can set one later with “Forgot password”." : "");

      setStep("form");
    } catch (err) {
      setError(err.message || "Invalid verification code");
      setStep("otp");
    }
  };

  const resendOtp = async () => {
    setError("");
    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
        },
      });
      if (resendError) throw resendError;
    } catch (err) {
      setError(err.message || "Failed to resend verification code");
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    // A second tap before React re-renders must not send a duplicate link request.
    if (step === "verifying") return;
    setError("");
    const checked = validateMemberLink({ phone, fullName });
    setFieldErrors(checked.errors);
    if (!checked.ok) return;
    setStep("verifying");
    try {
      // The backend performs the authoritative name + phone match and the
      // account link; these values are only what it verifies against.
      await joinGym(checked.phone, checked.fullName);
      await reloadRole();
      setStep("success");
    } catch (err) {
      const code = err?.response?.data?.error || err?.code || err?.message || "";
      const messages = {
        member_not_found: "We couldn't find a gym member with that phone number.",
        name_mismatch: "The phone number is registered, but the full name does not match the gym's record.",
        account_already_linked: "This account is already linked to another gym membership. Sign out and use the Google/email account that belongs to this member.",
        link_failed: "We couldn't link this account to the membership. Please try again.",
        profile_link_failed: "Your membership was found, but your member profile could not be completed. Please try again.",
        multiple_members_for_phone: "This phone number is linked to more than one member record. Please ask the gym owner to correct the records.",
        member_account_required: "Please use a member account for Join Gym.",
        rate_limited: "Too many attempts. Please wait a few minutes and try again.",
        authentication_required: "Your sign-in session has expired. Please sign in again.",
      };
      setError(messages[code] || (String(code).includes("non-2xx") ? "Membership verification could not be completed. Please check your member details and try again." : String(code) || "Verification failed"));
      setStep("error");
    }
  };

  const errorBox = error && <p className="mb-4 rounded-lg bg-muted p-3 text-sm">{error}</p>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex h-14 items-center border-b border-border px-4">
        <button onClick={() => navigate("/login")} className="p-2 -ml-2 rounded-lg hover:bg-accent" aria-label="Back to sign in"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex flex-1 items-center justify-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Dumbbell className="w-4 h-4" /></div>
          <b className="font-heading">GymSync</b>
        </div>
        <div className="w-9" />
      </header>
      <div className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "checking" && <div className="py-10 text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" /></div>}

            {step === "account" && (
              <motion.div key="account" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-heading font-bold">Create your account</h1>
                <p className="mt-1 mb-6 text-sm text-muted-foreground">First, set up your login — then we'll verify your gym membership.</p>
                {errorBox}
                <SocialAuthButtons redirectTo="/auth/callback?next=member" onError={setError} />
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 text-muted-foreground">or</span></div>
                </div>
                <form onSubmit={createAccount} className="space-y-4">
                  <label className="block text-sm font-medium">Email
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type="email" autoComplete="email" className={`${inputCls} pl-10`} value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </label>
                  <label className="block text-sm font-medium">Password
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type="password" autoComplete="new-password" className={`${inputCls} pl-10`} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </label>
                  <button className={primary}>Create account <ArrowRight className="w-4 h-4" /></button>
                </form>
              </motion.div>
            )}

            {step === "creatingAccount" && <div className="py-10 text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" /><p className="mt-4 text-sm">Creating your account…</p></div>}

            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-heading font-bold">Verify your email</h1>
                <p className="mt-1 mb-6 text-sm text-muted-foreground">We sent a code to {email}</p>
                {errorBox}
                <div className="mb-6 flex justify-center">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                    <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
                  </InputOTP>
                </div>
                <button onClick={verifyOtp} disabled={otpCode.length < 6} className={`${primary} disabled:opacity-50`}>Verify</button>
                <p className="mt-4 text-center text-sm text-muted-foreground">Didn't receive the code? <button onClick={resendOtp} className="font-medium text-foreground underline">Resend</button></p>
              </motion.div>
            )}

            {step === "verifyingOtp" && <div className="py-10 text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" /><p className="mt-4 text-sm">Verifying…</p></div>}

            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-heading font-bold">Join your gym</h1>
                <p className="mt-1 mb-6 text-sm text-muted-foreground">Enter your phone number and the full name your gym registered you with.</p>
                {notice && <p className="mb-4 rounded-lg bg-muted p-3 text-sm">{notice}</p>}
                {errorBox}
                <form onSubmit={verify} className="space-y-4" noValidate>
                  <label className="block text-sm font-medium">Registered phone number
                    <div className="relative mt-1.5"><PhoneNumberField value={phone} onChange={setPhone} /></div>
                    {fieldErrors.phone && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{fieldErrors.phone}</p>}
                  </label>
                  <label className="block text-sm font-medium">Full name (as registered by your gym)
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input className={`${inputCls} pl-10`} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
                    </div>
                    {fieldErrors.fullName && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{fieldErrors.fullName}</p>}
                  </label>
                  <button className={primary}>Verify information <ArrowRight className="w-4 h-4" /></button>
                  <p className="text-center text-xs text-muted-foreground">Your gym confirms these details against the membership it created for you.</p>
                </form>
              </motion.div>
            )}

            {step === "verifying" && <div className="py-10 text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" /><p className="mt-4 text-sm">Verifying your information…</p></div>}

            {step === "success" && (
              <div className="text-center">
                <CheckCircle2 className="mx-auto mb-4 w-16 h-16 text-emerald-600 dark:text-emerald-400" />
                <h1 className="text-2xl font-heading font-bold">Membership verified</h1>
                <p className="mt-2 mb-6 text-sm text-muted-foreground">Your exact membership information is now linked.</p>
                <button onClick={() => navigate("/member")} className={primary}>Continue to member app</button>
              </div>
            )}

            {step === "error" && (
              <div className="text-center">
                <AlertCircle className="mx-auto mb-4 w-16 h-16 text-muted-foreground" />
                <h1 className="text-2xl font-heading font-bold">We couldn't verify your information</h1>
                <p className="mt-2 mb-6 text-sm text-muted-foreground">{error}</p>
                <button onClick={() => setStep("form")} className={primary}>Try again</button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}