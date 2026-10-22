"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

/** Bottom sheet that stays inside the phone frame. */
export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="animate-rise relative flex max-h-[82%] flex-col rounded-t-[24px] border-t border-ink bg-white pb-6">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="font-heading text-[20px] font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-ink/5">
            <X size={22} />
          </button>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5">{children}</div>
      </div>
    </div>
  );
}
