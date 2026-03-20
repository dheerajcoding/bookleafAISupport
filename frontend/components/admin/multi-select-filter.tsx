"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, LucideIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface MultiSelectFilterProps {
  label: string;
  icon: LucideIcon;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function MultiSelectFilter({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggleOption(option: string) {
    if (selectedSet.has(option)) {
      onChange(selected.filter((item) => item !== option));
      return;
    }
    onChange([...selected, option]);
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        className="w-full justify-between border-[#cdb188] bg-[#fffaf2] text-[#3f3324] hover:bg-[#f7ebd7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4 text-[#8d7447]" />
          {label}
          {selected.length > 0 && <span className="rounded-full bg-[#f1dfbf] px-2 py-0.5 text-xs text-[#6e552f]">{selected.length}</span>}
        </span>
        <ChevronDown className="size-4 text-[#6e552f] dark:text-[#f1dfbd]" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-[#cdb188] bg-[#fffdf8] p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {options.map((option) => {
                const isChecked = selectedSet.has(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-[#3f3324] transition hover:bg-[#f7eddc] dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <span>{option}</span>
                    {isChecked && <Check className="size-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex justify-between border-t border-[#e8dbc4] pt-2 dark:border-slate-700">
              <Button size="sm" variant="ghost" className="text-[#6e552f] hover:text-[#3f3324]" onClick={clearAll}>
                Clear
              </Button>
              <Button size="sm" variant="ghost" className="text-[#6e552f] hover:text-[#3f3324]" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((item) => (
            <button
              key={item}
              type="button"
              className="paper-chip"
              onClick={() => toggleOption(item)}
            >
              {item}
              <X className="size-3.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
