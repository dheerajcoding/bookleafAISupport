"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  accentClassName: string;
  delay?: number;
}

function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    let start = 0;

    function animate(timestamp: number) {
      if (!start) {
        start = timestamp;
      }
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(target * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
}

export function AdminStatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accentClassName,
  delay = 0,
}: StatCardProps) {
  const displayValue = useCountUp(value);

  const gradientClass = useMemo(
    () => ({
      amber: "from-amber-50 to-orange-50 border-amber-200/80",
      blue: "from-sky-50 to-blue-50 border-blue-200/80",
      emerald: "from-emerald-50 to-teal-50 border-emerald-200/80",
      rose: "from-rose-50 to-red-50 border-rose-200/80",
    }),
    [],
  );

  const tone = gradientClass[accentClassName as keyof typeof gradientClass] || gradientClass.amber;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`surface-card group relative overflow-hidden border bg-gradient-to-br ${tone} p-4`}
    >
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ boxShadow: "inset 0 0 0 1px rgba(196, 155, 90, 0.45)" }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="ink-kicker">{label}</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{displayValue}</p>
          <p className="mt-1 text-xs text-[#6f6250]">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-2.5 text-[#8d7447] shadow-sm">
          <Icon className="size-4" />
        </div>
      </div>
    </motion.div>
  );
}
