import React, { useState } from "react";
import { Link } from "react-router-dom";
import { signInWithEmail, signInWithProvider } from "@/lib/supabaseAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Dumbbell } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const [role, setRole] = useState("owner"); // owner | member
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const ownerGoogle = async () => { try { await signInWithProvider("google", window.location.origin + returnTo); } catch (err) { setError(err.message || "Google sign in is unavailable"); } };
  const memberGoogle = async () => { try { await signInWithProvider("google", window.location.origin + "/member"); } catch (err) { setError(err.message || "Google sign in is unavailable"); } };

  const Toggle = () => (
    <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted mb-6">
      <button type="button" onClick={() => setRole("owner")} className={`py-2 text-sm font-medium rounded-md transition-colors ${role === "owner" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Manage a gym</button>
      <button type="button" onClick={() => setRole("member")} className={`py-2 text-sm font-medium rounded-md transition-colors ${role === "member" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>I'm a member</button>
    </div>
  );

  return (
    <AuthLayout
      icon={role === "owner" ? LogIn : Dumbbell}
      title={role === "owner" ? "Welcome back" : "Member sign in"}
      subtitle={role === "owner" ? "Log in to manage your gym" : "Access your gym membership"}
      footer={
        role === "owner" ? (
          <>
            Don't have an account?{" "}
            <Link to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")} className="text-primary font-medium hover:underline">Create one</Link>
          </>
        ) : (
          <>
            First time here?{" "}
            <Link to="/join-gym" className="text-primary font-medium hover:underline">Join your gym</Link>
          </>
        )
      }
    >
      <Toggle />

      {role === "owner" ? (
        <>
          <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={ownerGoogle}>
            <GoogleIcon className="w-5 h-5 mr-2" /> Continue with Google
          </Button>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground">or</span></div>
          </div>
          {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
              {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging in...</>) : ("Log in")}
            </Button>
          </form>
        </>
      ) : (
        <>
          <Button variant="outline" className="w-full h-12 text-sm font-medium mb-4" onClick={memberGoogle}>
            <GoogleIcon className="w-5 h-5 mr-2" /> Continue with Google
          </Button>
          <p className="text-xs text-muted-foreground text-center">Member access is linked to your existing membership. Your gym provides this — you can't create a membership here.</p>
          <div className="mt-6 p-3 rounded-lg bg-muted/60 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Don't have a membership yet?</p>
            You'll need to register at your gym first, then <Link to="/join-gym" className="text-primary font-medium hover:underline">join from here</Link> using your registered phone number.
          </div>
        </>
      )}
    </AuthLayout>
  );
}