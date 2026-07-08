import type { ReactNode } from "react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  impactExplanation?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (reason?: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  impactExplanation,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  requireReason = false,
  reasonLabel = "Reason for this action",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (requireReason && !reason.trim()) return;
    onConfirm(requireReason ? reason : undefined);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isLoading) {
      setReason("");
      onOpenChange(false);
    } else if (isOpen) {
      onOpenChange(true);
    }
  };

  const isConfirmDisabled = isLoading || (requireReason && !reason.trim());

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div>{description}</div>
              {impactExplanation ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {impactExplanation}
                </div>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requireReason ? (
          <div className="grid gap-2 py-4">
            <Label htmlFor="confirm-reason">{reasonLabel}</Label>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason..."
              disabled={isLoading}
              className="resize-none"
            />
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {isLoading ? "Please wait..." : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
