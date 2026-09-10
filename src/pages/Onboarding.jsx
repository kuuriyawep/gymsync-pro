import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import QuestionScreen from "@/components/onboarding/QuestionScreen";
import VisualScreen from "@/components/onboarding/VisualScreen";
import Paywall from "@/components/onboarding/Paywall";
import WelcomePath from "@/components/onboarding/WelcomePath";
import { DashboardPreview, PaymentsPreview, StaffPreview, ValueSummary } from "@/components/onboarding/OwnerVisuals";
import GymProfileSetup from "@/components/onboarding/GymProfileSetup";
import { setGym } from "@/lib/gymStore";
import { useToast } from "@/components/ui/use-toast";
import { UserCog, Users, ListChecks, Eye, CreditCard, BarChart3, Zap, Sparkles, Flame, MessageSquare, LayoutDashboard, Dumbbell, Building2 } from "lucide-react";

const OWNER_ROLES = [
  { value: "owner", label: "Gym Owner", icon: UserCog },
  { value: "manager", label: "Gym Manager", icon: Users },
  { value: "staff", label: "Staff / Administrator", icon: ListChecks },
];

const ownerQuestions = [
  { id: "memberCount", icon: Users, title: "How many members do you have?", options: [
    { value: "1–50", label: "1–50" }, { value: "51–100", label: "51–100" }, { value: "101–250", label: "101–250" }, { value: "250+", label: "250+" },
  ]},
  { id: "management", icon: ListChecks, title: "How do you currently manage your gym?", options: [
    { value: "paper", label: "Notebook / paper" }, { value: "sheets", label: "Excel / Google Sheets" }, { value: "whatsapp", label: "WhatsApp" }, { value: "other", label: "Another system" }, { value: "manual", label: "Nothing / manually" },
  ]},
  { id: "challenge", icon: Eye, title: "What's taking the most time right now?", options: [
    { value: "memberships", label: "Tracking memberships" }, { value: "payments", label: "Tracking payments" }, { value: "expiring", label: "Knowing who is expiring" }, { value: "staff", label: "Managing staff" }, { value: "attendance", label: "Attendance" }, { value: "performance", label: "Understanding performance" }, { value: "organized", label: "Keeping everything organized" },
  ]},
  { id: "outcome", multi: true, maxSelections: 2, icon: Zap, title: "What would make GymSync a win for you?", subtitle: "Choose up to 2.", options: [
    { value: "time", label: "Save time every day" }, { value: "renewals", label: "Never miss renewals" }, { value: "payments", label: "Keep payments organized" }, { value: "performance", label: "Understand my gym better" }, { value: "members", label: "Manage members more easily" }, { value: "staff", label: "Give my team better tools" }, { value: "engagement", label: "Keep members engaged" },
  ]},
  { id: "visibility", icon: BarChart3, title: "Can you quickly answer how your gym is doing?", subtitle: "Revenue, active members and who's expiring.", options: [
    { value: "easily", label: "Yes, easily" }, { value: "some-effort", label: "With some effort" }, { value: "hard", label: "It's hard" }, { value: "no", label: "Not really" },
  ]},
];

const memberSteps = [
  { id: "goal", kind: "question", icon: Dumbbell, title: "What are you training for?", options: [
    { value: "muscle", label: "Build muscle" }, { value: "strength", label: "Get stronger" }, { value: "fat-loss", label: "Lose fat" }, { value: "active", label: "Stay active" }, { value: "consistency", label: "Improve consistency" }, { value: "other", label: "Something else" },
  ]},
  { id: "frequency", kind: "question", icon: LayoutDashboard, title: "How often do you want to train?", options: [
    { value: "2-3", label: "2–3 days a week" }, { value: "4", label: "4 days a week" }, { value: "5", label: "5 days a week" }, { value: "6+", label: "6+ days a week" },
  ]},
  { id: "preferredTime", kind: "question", icon: Flame, title: "When do you usually train?", options: [
    { value: "morning", label: "Morning" }, { value: "afternoon", label: "Afternoon" }, { value: "evening", label: "Evening" },
  ]},
  { id: "memberValue", kind: "visual", icon: Sparkles, title: "Your GymSync member experience", subtitle: "A simple place for your membership, gym connection and progress.", visual: MemberValueVisual },
  { id: "join", kind: "cta" },
];

function MemberValueVisual() {
  return (
    <div className="space-y-2.5">
      {[
        [CreditCard, "Membership", "See your status, expiry and balance."],
        [Dumbbell, "Workout", "Create a plan, use a template and log workouts."],
        [BarChart3, "Profile & progress", "See attendance, consistency and workout history."],
        [MessageSquare, "Stay connected", "Send feedback and requests to your gym."],
      ].map(([Icon, title, desc]) => (
        <div key={title} className="bg-white border border-black/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
          <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-black/50">{desc}</p></div>
        </div>
      ))}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [path, setPath] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    try {
      const pending = JSON.parse(sessionStorage.getItem("gymsync_onboarding") || "null");
      if (pending?.path) {
        setPath(pending.path);
        setAnswers(pending.answers || {});
        if (pending.resumeStepId) {
          const allIds = ["role", ...ownerQuestions.map((s) => s.id), "value", "solDashboard", "solPayments", "solStaff", "account", "gymProfile", "paywall", ...memberSteps.map((s) => s.id)];
          const idx = allIds.indexOf(pending.resumeStepId);
          if (idx >= 0) setStep(0);
        }
        sessionStorage.removeItem("gymsync_onboarding_resume");
      }
    } catch (_) {}
  }, []);

  const savePending = (extra = {}) => {
    sessionStorage.setItem("gymsync_onboarding", JSON.stringify({ path, answers, ...extra }));
  };

  const role = answers.role || "owner";
  const steps = useMemo(() => {
    if (path === "member") return memberSteps;
    if (path !== "owner") return [];

    const roleTitle = role === "owner" ? "Gym Owner" : role === "manager" ? "Gym Manager" : "Staff / Administrator";
    const roleSteps = [
      { id: "role", kind: "question", icon: UserCog, title: "What best describes you?", subtitle: "We'll tailor the setup to your role.", options: OWNER_ROLES },
      ...ownerQuestions,
      { id: "value", kind: "visual", icon: Sparkles, title: role === "owner" ? "Your GymSync setup" : `GymSync for ${roleTitle.toLowerCase()}s`, subtitle: "A workspace shaped around what you want to improve.", visual: ValueSummary, useAnswers: true },
    ];

    const outcome = answers.outcome || [];
    const challenge = answers.challenge;
    const showDashboard = outcome.includes("performance") || answers.visibility === "hard" || answers.visibility === "no" || challenge === "performance";
    const showPayments = outcome.includes("payments") || outcome.includes("renewals") || challenge === "payments" || challenge === "expiring";
    const showStaff = outcome.includes("staff") || challenge === "staff" || role === "manager" || role === "staff";
    if (showDashboard) roleSteps.push({ id: "solDashboard", kind: "visual", icon: BarChart3, title: "See your gym at a glance", subtitle: "Revenue, members and expiry — all in one dashboard.", visual: DashboardPreview });
    if (showPayments) roleSteps.push({ id: "solPayments", kind: "visual", icon: CreditCard, title: "Payments without the chase", subtitle: "Record payments, track balances and know what's outstanding.", visual: PaymentsPreview });
    if (showStaff) roleSteps.push({ id: "solStaff", kind: "visual", icon: Users, title: "Staff & access, controlled", subtitle: "Give your team access without losing control.", visual: StaffPreview });

    roleSteps.push({ id: "account", kind: "account" });
    if (role === "owner") {
      roleSteps.push({ id: "gymProfile", kind: "gymProfile", icon: Building2, title: "Set up your gym profile", subtitle: "Add the essentials. Your logo is optional and everything can be changed later." });
      roleSteps.push({ id: "paywall", kind: "paywall" });
    } else {
      roleSteps.push({ id: "access", kind: "visual", icon: UserCog, title: "Your access stays under owner control", subtitle: "A gym owner can invite you and choose exactly what you can manage.", visual: StaffPreview });
    }
    return roleSteps;
  }, [path, role, answers.outcome, answers.challenge, answers.visibility]);

  const current = steps[step];
  const nextIsPaywall = steps[step + 1]?.kind === "paywall";

  const choose = (p) => {
    setPath(p); setStep(0); setAnswers({});
    sessionStorage.removeItem("gymsync_onboarding");
    if (p === "owner") sessionStorage.setItem("onboarding_role", "owner");
    else sessionStorage.removeItem("onboarding_role");
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  };
  const back = () => (step === 0 ? setPath(null) : setStep(step - 1));
  const finish = () => navigate(path === "member" ? "/join-gym" : "/login");

  const startAccount = (provider = "email") => {
    const pending = { path, answers, resumeStepId: path === "owner" ? "gymProfile" : "join" };
    sessionStorage.setItem("gymsync_onboarding", JSON.stringify(pending));
    sessionStorage.setItem("onboarding_role", role);
    const returnTo = encodeURIComponent("/onboarding");
    if (provider === "email") navigate(`/register?returnTo=${returnTo}`);
    else navigate(`/register?provider=${provider}&returnTo=${returnTo}`);
  };

  if (!path) return <OnboardingShell step={0} total={1} hideProgress><WelcomePath onChoose={choose} /></OnboardingShell>;
  if (!current) return null;

  let content = null;
  let footer = null;

  if (current.kind === "question") {
    const answered = current.multi ? (answers[current.id] || []).length > 0 : !!answers[current.id];
    content = <QuestionScreen icon={current.icon} title={current.title} subtitle={current.subtitle} options={current.options} multi={current.multi} value={answers[current.id]} maxSelections={current.maxSelections} onChange={(v) => setAnswers((a) => ({ ...a, [current.id]: v }))} />;
    footer = <button onClick={next} disabled={!answered} className={`w-full py-3 text-sm font-semibold rounded-xl transition-colors ${answered ? "bg-black text-white hover:bg-black/90" : "bg-black/10 text-black/40"}`}>Continue</button>;
  } else if (current.kind === "account") {
    content = <VisualScreen icon={Sparkles} title="Your setup is ready to continue" subtitle="Create an account to save your answers and continue into GymSync."><div className="space-y-3"><button onClick={() => startAccount("email")} className="w-full py-3 text-sm font-semibold rounded-xl bg-black text-white hover:bg-black/90">Continue with Email</button><button onClick={() => startAccount("google")} className="w-full py-3 text-sm font-medium rounded-xl border border-black/15 hover:bg-black/5">Continue with Google</button><button onClick={() => startAccount("apple")} className="w-full py-3 text-sm font-medium rounded-xl border border-black/15 hover:bg-black/5">Continue with Apple</button><p className="text-xs text-black/40 text-center pt-1">Free to start. No payment required.</p></div></VisualScreen>;
  } else if (current.kind === "visual") {
    const Visual = current.visual;
    content = <VisualScreen icon={current.icon} title={current.title} subtitle={current.subtitle}><Visual {...(current.useAnswers ? { answers } : {})} /></VisualScreen>;
    footer = <button onClick={next} className="w-full py-3 text-sm font-semibold rounded-xl bg-black text-white hover:bg-black/90">{nextIsPaywall ? "See GymSync Pro" : "Continue"}</button>;
  } else if (current.kind === "gymProfile") {
    const gp = answers.gymProfile || {};
    content = <VisualScreen icon={current.icon} title={current.title} subtitle={current.subtitle}><GymProfileSetup value={gp} onChange={(v) => { const updated = { ...gp, ...v }; setAnswers((a) => ({ ...a, gymProfile: updated })); setGym({ name: updated.name, location: updated.location, logoUrl: updated.logoUrl }); }} /></VisualScreen>;
    footer = <button onClick={next} disabled={!gp.name || !gp.location} className={`w-full py-3 text-sm font-semibold rounded-xl transition-colors ${gp.name && gp.location ? "bg-black text-white hover:bg-black/90" : "bg-black/10 text-black/40"}`}>Continue</button>;
  } else if (current.kind === "paywall") {
    content = <Paywall answers={answers} onContinue={() => toast({ title: "Pro trial", description: "Your account and gym workspace are ready. Subscription billing will be connected during backend setup." })} onLater={() => navigate("/")} onRestore={() => toast({ title: "Restore purchase", description: "Purchase restoration will be connected to Apple/Google billing in the backend phase." })} />;
  } else if (current.kind === "cta") {
    content = <VisualScreen icon={Dumbbell} title="Join your gym" subtitle="Already a member of a GymSync gym?"><div className="space-y-3"><p className="text-sm text-black/60">Verify your membership with your registered phone number and full name, then link your account to access the member app.</p><div className="bg-white border border-black/10 rounded-xl p-4 flex items-center gap-2 text-sm font-medium"><Dumbbell className="w-4 h-4" /> Join your gym</div></div></VisualScreen>;
    footer = <button onClick={() => navigate("/join-gym")} className="w-full py-3 text-sm font-semibold rounded-xl bg-black text-white hover:bg-black/90">Continue to join</button>;
  }

  return <OnboardingShell step={step} total={steps.length} onBack={back}><AnimatePresence mode="wait"><motion.div key={current.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="flex-1 flex flex-col">{content}</motion.div></AnimatePresence>{footer}</OnboardingShell>;
}