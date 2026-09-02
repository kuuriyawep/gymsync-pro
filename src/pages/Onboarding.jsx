import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import QuestionScreen from "@/components/onboarding/QuestionScreen";
import VisualScreen from "@/components/onboarding/VisualScreen";
import Paywall from "@/components/onboarding/Paywall";
import WelcomePath from "@/components/onboarding/WelcomePath";
import { DashboardPreview, PaymentsPreview, StaffPreview, ValueSummary } from "@/components/onboarding/OwnerVisuals";
import { StreakVisual, MembershipCardVisual, ConnectedVisual, MemberDashboardPreview } from "@/components/onboarding/MemberVisuals";
import { useToast } from "@/components/ui/use-toast";
import { UserCog, Users, CalendarClock, ListChecks, Eye, CreditCard, Clock, BarChart3, Zap, Sparkles, Flame, MessageSquare, LayoutDashboard, Dumbbell } from "lucide-react";

const ownerSteps = [
  { id: "role", kind: "question", icon: UserCog, title: "What best describes you?", subtitle: "This helps us tailor your setup.", options: [
    { value: "owner", label: "Gym Owner", icon: UserCog },
    { value: "manager", label: "Gym Manager", icon: Users },
    { value: "staff", label: "Staff / Administrator", icon: ListChecks },
  ]},
  { id: "gymAge", kind: "question", icon: CalendarClock, title: "How long has your gym been running?", options: [
    { value: "<6m", label: "Less than 6 months" },
    { value: "6-12m", label: "6–12 months" },
    { value: "1-3y", label: "1–3 years" },
    { value: "3y+", label: "3+ years" },
  ]},
  { id: "memberCount", kind: "question", icon: Users, title: "How many members do you have?", options: [
    { value: "1–50", label: "1–50" },
    { value: "51–100", label: "51–100" },
    { value: "101–250", label: "101–250" },
    { value: "250+", label: "250+" },
  ]},
  { id: "management", kind: "question", icon: ListChecks, title: "How do you currently manage your gym?", options: [
    { value: "paper", label: "Notebook / paper" },
    { value: "sheets", label: "Excel / Google Sheets" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "other", label: "Another system" },
    { value: "manual", label: "Nothing / manually" },
  ]},
  { id: "challenge", kind: "question", icon: Eye, title: "What's your biggest challenge?", options: [
    { value: "memberships", label: "Tracking memberships" },
    { value: "payments", label: "Tracking payments" },
    { value: "expiring", label: "Knowing who is expiring" },
    { value: "staff", label: "Managing staff" },
    { value: "attendance", label: "Attendance" },
    { value: "performance", label: "Understanding performance" },
    { value: "organized", label: "Keeping everything organized" },
  ]},
  { id: "payment", kind: "question", icon: CreditCard, title: "How do you track payments & balances?", subtitle: "We'll show you a better way.", options: [
    { value: "manual", label: "By hand / memory" },
    { value: "sheets", label: "Spreadsheets" },
    { value: "whatsapp", label: "WhatsApp notes" },
    { value: "app", label: "Another app" },
  ]},
  { id: "time", kind: "question", icon: Clock, title: "How much time on admin each day?", options: [
    { value: "<30m", label: "Less than 30 min" },
    { value: "30-1h", label: "30 min – 1 hour" },
    { value: "1-2h", label: "1–2 hours" },
    { value: "2h+", label: "2+ hours" },
  ]},
  { id: "visibility", kind: "question", icon: BarChart3, title: "Can you quickly answer how your gym is doing?", subtitle: "Revenue, active members, who's expiring.", options: [
    { value: "easily", label: "Yes, easily" },
    { value: "some-effort", label: "With some effort" },
    { value: "hard", label: "It's hard" },
    { value: "no", label: "Not really" },
  ]},
  { id: "automation", kind: "question", multi: true, icon: Zap, title: "What should GymSync handle for you?", subtitle: "Select all that apply.", options: [
    { value: "reminders", label: "Expiry reminders" },
    { value: "payments", label: "Payment tracking" },
    { value: "attendance", label: "Attendance & streaks" },
    { value: "reports", label: "Reports & analytics" },
    { value: "staff", label: "Staff access" },
    { value: "members", label: "Member management" },
  ]},
  { id: "solDashboard", kind: "visual", icon: BarChart3, title: "See your gym at a glance", subtitle: "Revenue, members and expiry — all in one dashboard.", visual: DashboardPreview },
  { id: "solPayments", kind: "visual", icon: CreditCard, title: "Payments without the chase", subtitle: "Record payments, track balances, know who's outstanding.", visual: PaymentsPreview },
  { id: "solStaff", kind: "visual", icon: Users, title: "Staff & access, controlled", subtitle: "Invite your team and limit what each role can do.", visual: StaffPreview },
  { id: "value", kind: "visual", icon: Sparkles, title: "Built for how you run your gym", subtitle: "Here's what GymSync means for you.", visual: ValueSummary, useAnswers: true },
  { id: "paywall", kind: "paywall" },
];

const memberSteps = [
  { id: "streak", kind: "visual", icon: Flame, title: "Your gym. Your membership. Your progress.", subtitle: "Show up consistently and keep your streak alive.", visual: StreakVisual },
  { id: "membership", kind: "visual", icon: CreditCard, title: "Stay on top of membership", subtitle: "Active status, expiry, days remaining and balance.", visual: MembershipCardVisual },
  { id: "connected", kind: "visual", icon: MessageSquare, title: "Stay connected to your gym", subtitle: "Send feedback, request equipment or a personal coach.", visual: ConnectedVisual },
  { id: "progress", kind: "visual", icon: LayoutDashboard, title: "Your progress at a glance", subtitle: "Everything you need, right on your home screen.", visual: MemberDashboardPreview },
  { id: "join", kind: "cta" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [path, setPath] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const steps = path === "owner" ? ownerSteps : path === "member" ? memberSteps : [];
  const current = steps[step];
  const nextIsPaywall = steps[step + 1]?.kind === "paywall";

  const choose = (p) => { setPath(p); setStep(0); setAnswers({}); };
  const next = () => (step < steps.length - 1 ? setStep(step + 1) : finish());
  const back = () => (step === 0 ? setPath(null) : setStep(step - 1));
  const finish = () => navigate(path === "owner" ? "/login" : "/join-gym");

  if (!path) {
    return (
      <OnboardingShell step={0} total={1} hideProgress>
        <WelcomePath onChoose={choose} />
      </OnboardingShell>
    );
  }

  let content = null;
  let footer = null;

  if (current.kind === "question") {
    const answered = current.multi ? (answers[current.id] || []).length > 0 : !!answers[current.id];
    content = (
      <QuestionScreen icon={current.icon} title={current.title} subtitle={current.subtitle} options={current.options} multi={current.multi} value={answers[current.id]} onChange={(v) => setAnswers((a) => ({ ...a, [current.id]: v }))} />
    );
    footer = <button onClick={next} disabled={!answered} className={`w-full py-3 text-sm font-semibold rounded-xl transition-colors ${answered ? "bg-black text-white hover:bg-black/90" : "bg-black/10 text-black/40"}`}>Continue</button>;
  } else if (current.kind === "visual") {
    const Visual = current.visual;
    content = (
      <VisualScreen icon={current.icon} title={current.title} subtitle={current.subtitle}>
        {current.useAnswers ? <Visual answers={answers} /> : <Visual />}
      </VisualScreen>
    );
    footer = <button onClick={next} className="w-full py-3 text-sm font-semibold rounded-xl bg-black text-white hover:bg-black/90">{nextIsPaywall ? "See GymSync Pro" : "Continue"}</button>;
  } else if (current.kind === "paywall") {
    content = <Paywall onContinue={() => navigate("/register")} onLater={() => navigate("/login")} onRestore={() => toast({ title: "Restore purchase", description: "No purchase found (demo)." })} />;
  } else if (current.kind === "cta") {
    content = (
      <VisualScreen icon={Dumbbell} title="Join your gym" subtitle="Already a member of a GymSync gym?">
        <div className="space-y-3">
          <p className="text-sm text-black/60">Verify your membership with your registered phone number and full name, then link your account to access the member app.</p>
          <div className="bg-white border border-black/10 rounded-xl p-4 flex items-center gap-2 text-sm font-medium"><Dumbbell className="w-4 h-4" /> Olympic Gym</div>
        </div>
      </VisualScreen>
    );
    footer = <button onClick={() => navigate("/join-gym")} className="w-full py-3 text-sm font-semibold rounded-xl bg-black text-white hover:bg-black/90">Continue to join</button>;
  }

  return (
    <OnboardingShell step={step} total={steps.length} onBack={back}>
      <AnimatePresence mode="wait">
        <motion.div key={current.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="flex-1 flex flex-col">
          {content}
        </motion.div>
      </AnimatePresence>
      {footer}
    </OnboardingShell>
  );
}