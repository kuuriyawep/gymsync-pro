import React,{useState} from "react";
import { Link,useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock,Loader2,AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword(){
 const [params]=useSearchParams(); const resetToken=params.get("token")||params.get("resetToken")||""; const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
 const submit=async(e)=>{e.preventDefault();setError("");if(password!==confirm){setError("Passwords do not match");return;}setLoading(true);try{await base44.auth.resetPassword({resetToken,newPassword:password});window.location.href="/login";}catch(err){setError(err.message||"Failed to reset password");}finally{setLoading(false);}};
 if(!resetToken)return <AuthLayout icon={AlertTriangle} title="Invalid reset link" subtitle="This password reset link is missing or invalid" footer={<Link to="/forgot-password" className="text-primary font-medium hover:underline">Request a new link</Link>}><p className="text-sm text-foreground text-center">Please request a new password reset email.</p></AuthLayout>;
 return <AuthLayout icon={Lock} title="New password" subtitle="Enter your new password below">{error&&<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}<form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="password">New Password</Label><Input id="password" type="password" autoComplete="new-password" autoFocus value={password} onChange={(e)=>setPassword(e.target.value)} className="h-12" required/></div><div className="space-y-2"><Label htmlFor="confirm">Confirm Password</Label><Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="h-12" required/></div><Button type="submit" className="w-full h-12 font-medium" disabled={loading}>{loading?<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Resetting...</>:"Reset password"}</Button></form></AuthLayout>;
}
