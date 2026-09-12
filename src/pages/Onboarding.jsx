import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import QuestionScreen from "@/components/onboarding/QuestionScreen";
import VisualScreen from "@/components/onboarding/VisualScreen";
import Paywall from "@/components/onboarding/Paywall";
import WelcomePath from "@/components/onboarding/WelcomePath";
import { DashboardPreview, PaymentsPreview, StaffPreview, ValueSummary } from "@/components/onboarding/OwnerVisuals";
import { StreakVisual, MembershipCardVisual, ConnectedVisual, MemberDashboardPreview } from "@/components/onboarding/MemberVisuals";
import GymProfileSetup from "@/components/onboarding/GymProfileSetup";
import { setGym } from "@/lib/gymStore";
import { useAuth } from "@/lib/AuthContext";
import { invokeWithAuth } from "@/lib/invokeWithAuth";
import { useToast } from "@/components/ui/use-toast";
import { UserCog, Users, ListChecks, Eye, CreditCard, BarChart3, Zap, Sparkles, Flame, MessageSquare, LayoutDashboard, Dumbbell, Building2 } from "lucide-react";

const ownerQuestions = [
  { id: "role", kind: "question", icon: UserCog, title: "What best describes you?", subtitle: "This helps us tailor your setup.", options: [
    { value: "owner", label: "Gym Owner", icon: UserCog }, { value: "manager", label: "Gym Manager", icon: Users }, { value: "staff", label: "Staff / Administrator", icon: ListChecks },
  ]},
  { id: "memberCount", kind: "question", icon: Users, title: "How many members do you have?", options: [
    { value: "1–50", label: "1–50" }, { value: "51–100", label: "51–100" }, { value: "101–250", label: "101–250" }, { value: "250+", label: "250+" },
  ]},
  { id: "management", kind: "question", icon: ListChecks, title: "How do you currently manage your gym?", options: [
    { value: "paper", label: "Notebook / paper" }, { value: "sheets", label: "Excel / Google Sheets" }, { value: "whatsapp", label: "WhatsApp" }, { value: "other", label: "Another system" }, { value: "manual", label: "Nothing / manually" },
  ]},
  { id: "challenge", kind: "question", icon: Eye, title: "What's your biggest challenge?", options: [
    { value: "memberships", label: "Tracking memberships" }, { value: "payments", label: "Tracking payments" }, { value: "expiring", label: "Knowing who is expiring" }, { value: "staff", label: "Managing staff" }, { value: "attendance", label: "Attendance" }, { value: "performance", label: "Understanding performance" }, { value: "organized", label: "Keeping everything organized" },
  ]},
  { id: "outcome", kind: "question", multi: true, maxSelections: 2, icon: Zap, title: "What would make GymSync a win for you?", subtitle: "Choose up to 2.", options: [
    { value: "time", label: "Save time every day" }, { value: "renewals", label: "Never miss renewals" }, { value: "payments", label: "Keep payments organized" }, { value: "performance", label: "Understand my gym better" }, { value: "members", label: "Manage members more easily" }, { value: "staff", label: "Give my team better tools" }, { value: "engagement", label: "Keep members engaged" },
  ]},
  { id: "visibility", kind: "question", icon: BarChart3, title: "Can you quickly answer how your gym is doing?", subtitle: "Revenue, active members and who's expiring.", options: [
    { value: "easily", label: "Yes, easily" }, { value: "some-effort", label: "With some effort" }, { value: "hard", label: "It's hard" }, { value: "no", label: "Not really" },
  ]},
];

const memberSteps = [
  { id: "welcome", kind: "visual", icon: Dumbbell, title: "Make your gym routine work for you", subtitle: "A simple member experience built around your goals.", visual: MemberDashboardPreview },
  { id: "goal", kind: "question", icon: Dumbbell, title: "What's your main goal?", options: [
    { value: "muscle", label: "Build muscle" }, { value: "strength", label: "Get stronger" }, { value: "fat", label: "Lose fat" }, { value: "active", label: "Stay active" }, { value: "consistency", label: "Improve consistency" },
  ]},
  { id: "frequency", kind: "question", icon: BarChart3, title: "How often do you want to train?", options: [
    { value: "2-3", label: "2–3 days a week" }, { value: "4", label: "4 days" }, { value: "5", label: "5 days" }, { value: "6+", label: "6+ days" },
  ]},
  { id: "preferredTime", kind: "question", icon: Flame, title: "When do you usually train?", options: [
    { value: "morning", label: "Morning" }, { value: "afternoon", label: "Afternoon" }, { value: "evening", label: "Evening" },
  ]},
  { id: "membership", kind: "visual", icon: CreditCard, title: "Your membership stays clear", subtitle: "See your status, expiry, payments and balance in one place.", visual: MembershipCardVisual },
  { id: "connected", kind: "visual", icon: MessageSquare, title: "Stay connected to your gym", subtitle: "Feedback, equipment requests, coach requests and notifications.", visual: ConnectedVisual },
  { id: "join", kind: "cta" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, profile } = useAuth();
  const [path, setPath] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [savingGym, setSavingGym] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("gymsync_onboarding_draft");
      if (raw) { const draft = JSON.parse(raw); if (draft.path) { setPath(draft.path); setAnswers(draft.answers || {}); setStep(Number(draft.step) || 0); } }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (path) sessionStorage.setItem("gymsync_onboarding_draft", JSON.stringify({ path, answers, step }));
  }, [path, answers, step]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("resume") === "1" && isAuthenticated && path === "owner") {
      const nextId = profile?.gym_id ? "paywall" : "gymProfile";
      const all = buildOwnerSteps(answers);
      const idx = all.findIndex((x) => x.id === nextId);
      if (idx >= 0) setStep(idx);
    }
  }, [location.search, isAuthenticated, path, profile?.gym_id]);

  const ownerSteps = useMemo(() => buildOwnerSteps(answers), [answers]);
  const steps = path === "owner" ? ownerSteps : path === "member" ? memberSteps : [];
  const current = steps[step];
  const nextIsPaywall = steps[step + 1]?.kind === "paywall";

  function choose(p) {
    setPath(p); setStep(0); setAnswers({});
    sessionStorage.setItem("onboarding_role", p === "owner" ? "owner" : "member");
  }

  function next() { if (step < steps.length - 1) setStep(step + 1); else finish(); }
  function back() { if (step === 0) setPath(null); else setStep(step - 1); }

  async function completeGymProfile() {
    const gp = answers.gymProfile || {};
    if (!isAuthenticated) {
      navigate("/register?returnTo=" + encodeURIComponent("/onboarding?resume=1"));
      return;
    }
    setSavingGym(true);
    try {
      const result = await invokeWithAuth("gymAccess", { operation: "createOwnerGym", gym: { name: gp.name, location: gp.location, logoUrl: gp.logoUrl || null } });
      if (result.error) throw new Error(result.error);
      setGym({ name: result.gym.name, address: result.gym.address, logoUrl: result.gym.logoUrl, phone: result.gym.phone, email: result.gym.email });
      setAnswers((a) => ({ ...a, gymId: result.gymId }));
      setStep((s) => s + 1);
      toast({ title: "Gym workspace created", description: "Your real GymSync workspace is ready." });
    } catch (error) {
      toast({ title: "Could not create gym", description: error.message || "Please try again.", variant: "destructive" });
    } finally { setSavingGym(false); }
  }

  function finish() { sessionStorage.removeItem("gymsync_onboarding_draft"); navigate(path === "owner" ? "/" : "/join-gym"); }

  if (!path) return <OnboardingShell step={0} total={1} hideProgress><WelcomePath onChoose={choose} /></OnboardingShell>;
  if (!current) return null;

  let content = null; let footer = null;
  if (current.kind === "question") {
    const answered = current.multi ? (answers[current.id] || []).length > 0 : !!answers[current.id];
    content = <QuestionScreen icon={current.icon} title={current.title} subtitle={current.subtitle} options={current.options} multi={current.multi} value={answers[current.id]} maxSelections={current.maxSelections} onChange={(v) => setAnswers((a) => ({ ...a, [current.id]: v }))} />;
    footer = <button onClick={next} disabled={!answered} className={`w-full py-3 text-sm font-semibold rounded-xl transition-colors ${answered ? "bg-black text-white hover:bg-black/90" : "bg-black/10 text-black/40"}`}>Continue</button>;
  } else if (current.kind === "visual") {
    const Visual = current.visual; content = <VisualScreen icon={current.icon} title={current.title} subtitle={current.subtitle}><Visual answers={answers} /></VisualScreen>;
    footer = <button onClick={next} className="w-full py-3 text-sm font-semibold rounded-xl bg-black text-white hover:bg-black/90">{nextIsPaywall ? "See GymSync Pro" : "Continue"}</button>;
  } else if (current.kind === "access") {
    content = <VisualScreen icon={Users} title={current.title} subtitle={current.subtitle}><div className="space-y-3"><div className="bg-black text-white rounded-2xl p-5"><p className="font-semibold">You do not need to create a gym.</p><p className="text-sm text-white/70 mt-1">Your owner can invite you and assign the right permissions. This keeps gym ownership and data secure.</p></div><p className="text-xs text-black/45 text-center">Already invited? Continue to sign in.</p></div></VisualScreen>;
    footer = <button onClick={() => navigate("/login")} className="w-full py-3 text-sm font-semibold rounded-xl bg-black text-white hover:bg-black/90">Go to sign in</button>;
  } else if (current.kind === "account") {
    content = <VisualScreen icon={Sparkles} title="Your gym is ready to get started" subtitle="Create an account to save your setup and continue into GymSync."><div className="space-y-3"><button onClick={() => navigate("/register?returnTo=" + encodeURIComponent("/onboarding?resume=1"))} className="w-full py-3 text-sm font-semibold rounded-xl bg-black text-white hover:bg-black/90">Create account</button><p className="text-xs text-black/40 text-center">Free to start. No payment required.</p></div></VisualScreen>;
  } else if (current.kind === "gymProfile") {
    const gp = answers.gymProfile || {}; content = <VisualScreen icon={Building2} title="Set up your gym profile" subtitle="Your gym name and location are required. Logo is optional."><GymProfileSetup value={gp} onChange={(v) => { const updated = { ...gp, ...v }; setAnswers((a) => ({ ...a, gymProfile: updated })); }} /></VisualScreen>;
    footer = <button onClick={completeGymProfile} disabled={!gp.name || !gp.location || savingGym} className={`w-full py-3 text-sm font-semibold rounded-xl ${gp.name && gp.location && !savingGym ? "bg-black text-white" : "bg-black/10 text-black/40"}`}>{savingGym ? "Creating workspace..." : "Create my gym"}</button>;
  } else if (current.kind === "paywall") {
    content = <Paywall answers={answers} onContinue={() => navigate("/")} onLater={() => navigate("/")} onRestore={() => toast({ title: "Restore purchase", description: "Purchase restoration will be connected to App Store / Google Play billing." })} />;
  } else if (current.kind === "cta") {
    content = <VisualScreen icon={Dumbbell} title="Join your gym" subtitle="Already a member of a GymSync gym?"><p className="text-sm text-black/60">Verify your membership with your registered phone number and full name, then link your account to access the member app.</p></VisualScreen>;
    footer = <button onClick={() => navigate("/join-gym")} className="w-full py-3 text-sm font-semibold rounded-xl bg-black text-white hover:bg-black/90">Continue to join</button>;
  }

  return <OnboardingShell step={step} total={steps.length} onBack={back}><AnimatePresence mode="wait"><motion.div key={current.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="flex-1 flex flex-col">{content}</motion.div></AnimatePresence>{footer}</OnboardingShell>;
}

function buildOwnerSteps(answers) {
  const q = ownerQuestions;
  if (answers.role && answers.role !== "owner") return [q[0], { id: "access", kind: "access", icon: Users, title: "Your gym admin controls access", subtitle: "Managers and staff join a gym through an invitation from the gym owner." }];
  const challenge = answers.challenge; const outcomes = answers.outcome || [];
  const showPayments = outcomes.includes("payments") || challenge === "payments";
  const showStaff = outcomes.includes("staff") || ["manager", "staff"].includes(answers.role) || challenge === "staff";
  const showDashboard = outcomes.includes("performance") || ["hard", "no"].includes(answers.visibility) || challenge === "performance";
  const previews = [];
  if (showDashboard) previews.push({ id: "solDashboard", kind: "visual", icon: BarChart3, title: "See your gym at a glance", subtitle: "Revenue, members and expiry — all in one dashboard.", visual: DashboardPreview });
  if (showPayments) previews.push({ id: "solPayments", kind: "visual", icon: CreditCard, title: "Payments without the chase", subtitle: "Record payments, track balances and know what's outstanding.", visual: PaymentsPreview });
  if (showStaff) previews.push({ id: "solStaff", kind: "visual", icon: Users, title: "Staff & access, controlled", subtitle: "Give your team access without losing control.", visual: StaffPreview });
  return [...q, { id: "value", kind: "visual", icon: Sparkles, title: "Your GymSync setup", subtitle: "A workspace shaped around what you want to improve.", visual: ValueSummary, useAnswers: true }, ...previews, { id: "account", kind: "account" }, { id: "gymProfile", kind: "gymProfile", icon: Building2, title: "Set up your gym profile" }, { id: "paywall", kind: "paywall" }];
}