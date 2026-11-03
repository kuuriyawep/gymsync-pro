import React from "react";
import { Phone, Mail, Calendar, Dumbbell, LogOut, User } from "lucide-react";
import MemberLayout from "@/components/MemberLayout";
import MemberDataState from "@/components/member/MemberDataState";
import PortalPill from "@/components/member/PortalPill";
import { useMemberPortal } from "@/lib/memberPortalStore";
import { membershipProgress } from "@/lib/memberPortalUtils";
import { useAuth } from "@/lib/AuthContext";
import ProfileImage from "@/components/ProfileImage";

const card = "rounded-2xl border border-border bg-card p-5";

const Row = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 border-b border-border py-3 last:border-0">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="w-4 h-4" /></div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold truncate">{value || "—"}</p>
    </div>
  </div>
);

export default function MemberProfile() {
  const { data, loaded, error } = useMemberPortal();
  const { logout } = useAuth();

  if (!loaded) {
    return <MemberLayout title="Profile"><div className="h-80 bg-muted animate-pulse rounded-xl" /></MemberLayout>;
  }
  if (!data) return <MemberDataState title="Profile" error={error} />;

  const progress = membershipProgress(data.membership.startDate, data.membership.expiryDate);

  return (
    <MemberLayout title="Profile" back="/member">
      <div className="space-y-5">
        <div className="text-center">
          <ProfileImage src={data.profile.photoUrl} alt={data.profile.name} fallback={data.profile.avatar} className="w-24 h-24 mx-auto text-2xl" dark />
          <h1 className="mt-3 text-xl font-heading font-bold">{data.profile.name}</h1>
          <p className="text-sm text-muted-foreground">{data.profile.memberId} · {data.profile.gym}</p>
        </div>

        <div className={card}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-semibold"><Dumbbell className="w-5 h-5" /> Membership</span>
            <PortalPill status={data.membership.status} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Plan</p><b>{data.membership.plan}</b></div>
            <div><p className="text-xs text-muted-foreground">Price</p><b>${data.membership.price}</b></div>
            <div><p className="text-xs text-muted-foreground">Start</p><b>{data.membership.startDate || "—"}</b></div>
            <div><p className="text-xs text-muted-foreground">Expiry</p><b>{data.membership.expiryDate || "—"}</b></div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{progress.remaining} days remaining</p>
          {data.balance?.balance > 0 && (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-xs text-muted-foreground">Outstanding Balance</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">${data.balance.balance}</p>
            </div>
          )}
        </div>

        <div className={card}>
          <h3 className="font-semibold">Personal information</h3>
          <Row icon={Phone} label="Phone" value={data.profile.phone} />
          <Row icon={Mail} label="Email" value={data.profile.email} />
          <Row icon={User} label="Gender" value={data.profile.gender} />
          <Row icon={Calendar} label="Member since" value={data.profile.joinDate} />
        </div>

        <button onClick={() => logout()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border p-3.5 text-sm font-medium hover:bg-accent">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
    </MemberLayout>
  );
}