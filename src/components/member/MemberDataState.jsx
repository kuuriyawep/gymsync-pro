import React from "react";
import { Link } from "react-router-dom";
import MemberLayout from "@/components/MemberLayout";
import { primaryBtn } from "@/lib/uiClasses";

export default function MemberDataState({ title = "Home", error }) {
  return (
    <MemberLayout title={title}>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-heading font-bold">Membership not linked</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error || "Link your registered gym membership to see your information."}</p>
          <Link to="/join-gym" className={`${primaryBtn} mt-5`}>Join your gym</Link>
        </div>
      </div>
    </MemberLayout>
  );
}