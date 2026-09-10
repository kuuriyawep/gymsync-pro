import React from "react";
import { Link } from "react-router-dom";
import MemberLayout from "@/components/MemberLayout";
export default function MemberDataState({ title = "Home", error }) {
  return <MemberLayout title={title}><div className="min-h-[60vh] flex items-center justify-center"><div className="text-center max-w-sm"><h1 className="text-xl font-bold">Membership not linked</h1><p className="text-sm text-black/50 mt-2">{error || "Link your registered gym membership to see your information."}</p><Link to="/join-gym" className="inline-flex mt-5 px-4 py-2.5 rounded-lg bg-black text-white text-sm font-medium">Join your gym</Link></div></div></MemberLayout>;
}