import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

/**
 * Attendance streak. When `celebrate` flips on, the flame and the count give a
 * single short pulse — enough to register that the streak grew, without a
 * confetti show on every visit.
 */
export default function StreakCard({ days, celebrate }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-center text-primary-foreground">
      <AnimatePresence>
        {celebrate && (
          <motion.span
            key="ring"
            initial={{ opacity: 0.45, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-7 h-20 w-20 -translate-x-1/2 rounded-full bg-primary-foreground/30"
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={celebrate ? { scale: [1, 1.3, 1], rotate: [0, -8, 8, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        className="relative mx-auto w-fit"
      >
        <Flame className="h-8 w-8" />
      </motion.div>

      <motion.p
        key={days}
        initial={celebrate ? { scale: 1.45, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        className="relative mt-2 text-3xl font-bold"
      >
        {days} day{days === 1 ? "" : "s"} streak
      </motion.p>

      <AnimatePresence>
        {celebrate && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative mt-1 text-[11px] font-semibold uppercase tracking-wider opacity-80"
          >
            Streak extended
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}