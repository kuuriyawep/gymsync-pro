import React from "react";
import { Link } from "react-router-dom";
import { Dumbbell, UserCog, ArrowRight } from "lucide-react";

export default function WelcomePath({ onChoose }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-8 mt-4">
        <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4"><Dumbbell className="w-7 h-7" /></div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Run your gym with clarity.</h1>
        <p className="text-sm text-muted-foreground mt-2 px-2">GymSync brings members, memberships, payments, staff and attendance into one place.</p>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">What best describes you?</p>
      <div className="space-y-3">
        <button onClick={() => onChoose("owner")} className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent text-left transition-colors">
          <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0"><UserCog className="w-5 h-5" /></div>
          <div className="flex-1 min-w-0"><p className="text-sm font-semibold">I manage a gym</p><p className="text-xs text-muted-foreground">Owner, manager or staff</p></div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
        <button onClick={() => onChoose("member")} className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent text-left transition-colors">
          <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Dumbbell className="w-5 h-5" /></div>
          <div className="flex-1 min-w-0"><p className="text-sm font-semibold">I'm a gym member</p><p className="text-xs text-muted-foreground">Track attendance & membership</p></div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-6">Already have an account? <Link to="/login" className="font-medium text-foreground hover:underline">Sign in</Link></p>
    </div>
  );
}