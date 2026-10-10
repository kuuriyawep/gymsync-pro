import React from "react";
import { Users, UserCheck, Clock, UserX, DollarSign, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";

/** @type {Array<[string, string, React.ComponentType<{ className?: string }>]>} */
const cards = [
  ["totalMembers", "Total Members", Users], ["activeMembers", "Active Members", UserCheck],
  ["expiringSoon", "Expiring Soon", Clock], ["expired", "Expired Members", UserX],
  ["monthlyRevenue", "Monthly Revenue", DollarSign], ["activeTrainers", "Active Trainers", Dumbbell],
];

export default function LiveStatCards({ stats }) {
  return <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
    {cards.map(([key, label, Icon], i) => <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }} className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
      <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center mb-3"><Icon className="w-4.5 h-4.5" /></div>
      <p className="text-xl md:text-2xl font-bold tracking-tight">{key === "monthlyRevenue" ? `$${stats[key].toLocaleString()}` : stats[key].toLocaleString()}</p>
      <p className="text-xs text-black/50 mt-0.5">{label}</p>
    </motion.div>)}
  </div>;
}