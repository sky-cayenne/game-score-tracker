"use client";

import type { ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "finish";
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Скасувати",
  variant = "primary",
  icon,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <button type="button" className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" aria-label="Закрити" onClick={onCancel} />
      <div className="absolute inset-x-3 bottom-[calc(12px+var(--safe-bottom))] mx-auto max-w-md rounded-md border border-ink/10 bg-white p-4 shadow-[0_24px_70px_rgba(23,32,28,0.22)]">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-mist text-felt">
            {icon ?? <AlertTriangle size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-black text-ink">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm font-bold leading-5 text-ink/62">{description}</p> : null}
          </div>
          <button type="button" className="tap-target rounded-md text-ink/45 hover:bg-mist hover:text-ink" aria-label="Закрити" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <div className={cancelLabel ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
          {cancelLabel ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button type="button" variant={variant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
