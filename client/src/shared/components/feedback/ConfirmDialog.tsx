import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
};

const variantStyles = {
  default: {
    confirmBg: "bg-mf-primary hover:bg-mf-primary-hover text-white",
    icon: "text-mf-primary",
  },
  danger: {
    confirmBg: "bg-mf-rose-pink hover:opacity-90 text-white",
    icon: "text-mf-rose-pink",
  },
  warning: {
    confirmBg: "bg-mf-soft-yellow hover:opacity-90 text-[#3a2a00]",
    icon: "text-mf-soft-yellow",
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const styles = variantStyles[variant];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/30 rounded-2xl border border-mf-border bg-mf-bg-card p-0 shadow-floating max-w-md w-full"
      onCancel={onCancel}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-bold text-mf-text">{title}</h2>
          <button
            onClick={onCancel}
            className="p-1 text-mf-text-muted hover:text-mf-text rounded-lg hover:bg-mf-bg-soft transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="text-sm text-mf-text-secondary leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-mf-border bg-mf-bg-soft/50 rounded-b-2xl">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-mf-text-secondary hover:text-mf-text rounded-xl border border-mf-border hover:bg-mf-bg-card transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={cn("px-4 py-2 text-sm font-medium rounded-xl transition-colors", styles.confirmBg)}
        >
          {confirmText}
        </button>
      </div>
    </dialog>
  );
}
