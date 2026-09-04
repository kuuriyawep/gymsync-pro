import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MemberLayout from "@/components/MemberLayout";
import { base44 } from "@/api/base44Client";
import { Phone, Mail, Calendar, Dumbbell, LogOut, ChevronRight, MessageSquare, Megaphone } from "lucide-react";
import { memberProfile, memberMembership, membershipProgress } from "@/lib/memberMockData";
import AppFeedbackModal from "@/components/AppFeedbackModal";
import ProfileProgress from "@/components/workout/ProfileProgress";
import { useWorkoutSessions } from "@/lib/workout/workoutStore";
import { computeStreak } from "@/lib/workout/workoutUtils";

const statusTone = { Active: "bg-black text-white", "Expiring Soon": "bg-black/10 text-black", Expired: "bg-black/5 text-black/50" };
const Row = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-3 border-b border-black/5 last:border-0">
    <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center"><Icon className="w-4 h-4" /></div>
    <div className="flex-1 min-w-0"><p className="text-xs text-black/50">{label}</p><p className="text-sm font-semibold truncate">{value}</p></div>
  </div>
);

export default function MemberProfile() {
  const [loading, setLoading] = useState(true);
  const [appFeedback, setAppFeedback] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const sessions = useWorkoutSessions();
  if (loading) return <MemberLayout title="Profile" back="/member"><div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-black/5 animate-pulse" />)}</div></MemberLayout>;

  const prog = membershipProgress(memberMembership.startDate, memberMembership.expiryDate);
  const workoutCount = sessions.filter((s) => s.completedAt).length;
  const streak = computeStreak(sessions);

  return (
    <MemberLayout title="Profile" back="/member">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold">{memberProfile.avatar}</div>
          <h1 className="text-xl font-heading font-bold mt-3">{memberProfile.name}</h1>
          <p className="text-sm text-black/50">{memberProfile.memberId} · {memberProfile.gym}</p>
          <div className="flex items-center gap-5 mt-3">
            <div className="text-center"><p className="text-base font-bold">{workoutCount}</p><p className="text-[11px] text-black/50">Workouts</p></div>
            <div className="w-px h-7 bg-black/10" />
            <div className="text-center"><p className="text-base font-bold">{streak}</p><p className="text-[11px] text-black/50">Streak</p></div>
          </div>
        </div>

        {/* Fitness progress */}
        <ProfileProgress />

        {/* Membership card */}
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Dumbbell className="w-5 h-5" /><h3 className="font-semibold">Membership</h3></div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusTone[memberMembership.status]}`}>{memberMembership.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><p className="text-xs text-black/50">Plan</p><p className="text-sm font-semibold">{memberMembership.plan}</p></div>
            <div><p className="text-xs text-black/50">Price</p><p className="text-sm font-semibold">${memberMembership.price}</p></div>
            <div><p className="text-xs text-black/50">Start date</p><p className="text-sm font-semibold">{memberMembership.startDate}</p></div>
            <div><p className="text-xs text-black/50">Expiry date</p><p className="text-sm font-semibold">{memberMembership.expiryDate}</p></div>
          </div>
          <div className="flex items-center justify-between text-xs mb-1.5"><span className="text-black/50">{prog.remaining} days remaining</span><span className="text-black/50">{prog.pct}% used</span></div>
          <div className="h-2 rounded-full bg-black/5 overflow-hidden"><div className="h-full bg-black rounded-full" style={{ width: `${prog.pct}%` }} /></div>
        </div>

        {/* Personal info */}
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <h3 className="font-semibold mb-1">Personal information</h3>
          <Row icon={Phone} label="Phone" value={memberProfile.phone} />
          <Row icon={Mail} label="Email" value={memberProfile.email} />
          <Row icon={Calendar} label="Member since" value={memberProfile.joinDate} />
        </div>

        {/* Link */}
        <button onClick={() => navigate("/member/feedback")} className="w-full bg-white border border-black/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-black/[0.02]">
          <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center"><MessageSquare className="w-4 h-4" /></div>
          <div className="flex-1 text-left"><p className="text-sm font-semibold">Send feedback or a request</p><p className="text-xs text-black/50">Complaints, machine & coach requests</p></div>
          <ChevronRight className="w-4 h-4 text-black/40" />
        </button>

        {/* App feedback */}
        <button onClick={() => setAppFeedback(true)} className="w-full bg-white border border-black/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-black/[0.02]">
          <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center"><Megaphone className="w-4 h-4" /></div>
          <div className="flex-1 text-left"><p className="text-sm font-semibold">Feedback about GymSync</p><p className="text-xs text-black/50">Report a bug or suggest an improvement</p></div>
          <ChevronRight className="w-4 h-4 text-black/40" />
        </button>

        {/* Sign out */}
        <button onClick={() => base44.auth.logout("/login")} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border border-black/15 hover:bg-black/5">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
      <AppFeedbackModal open={appFeedback} onClose={() => setAppFeedback(false)} />
    </MemberLayout>
  );
}