import React from "react";
import { Link } from "react-router-dom";
import { Dumbbell, UserCog, ArrowRight } from "lucide-react";

export default function WelcomePath({ onChoose }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-8 mt-4">
        <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mx-auto mb-4"><Dumbbell className="w-7 h-7" /></div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Run your gym with clarity.</h1>
        <p className="text-sm text-black/50 mt-2 px-2">GymSync brings members, memberships, payments, staff and attendance into one place.</p>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-2">What best describes you?</p>
      <div className="space-y-3">
        <button onClick={() => onChoose("owner")} className="w-full flex items-center gap-3 p-4 rounded-xl border border-black/15 bg-white hover:bg-black/[0.02] text-left transition-colors">
          <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center"><UserCog className="w-5 h-5" /></div>
          <div className="flex-1"><p className="text-sm font-semibold">I manage a gym</p><p className="text-xs text-black/50">Owner, manager or staff</p></div>
          <ArrowRight className="w-4 h-4 text-black/40" />
        </button>
        <button onClick={() => onChoose("member")} className="w-full flex items-center gap-3 p-4 rounded-xl border border-black/15 bg-white hover:bg-black/[0.02] text-left transition-colors">
          <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center"><Dumbbell className="w-5 h-5" /></div>
          <div className="flex-1"><p className="text-sm font-semibold">I'm a gym member</p><p className="text-xs text-black/50">Track attendance & membership</p></div>
          <ArrowRight className="w-4 h-4 text-black/40" />
        </button>
      </div>
      <p className="text-xs text-black/40 text-center mt-6">Already have an account? <Link to="/login" className="font-medium text-black hover:underline">Sign in</Link></p>
    </div>
  );
}