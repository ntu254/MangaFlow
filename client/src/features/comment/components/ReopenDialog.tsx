import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReopenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export function ReopenDialog({ open, onOpenChange, onConfirm, isSubmitting }: ReopenDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reopen Comment</DialogTitle>
          <DialogDescription>
            Please provide a reason for reopening this comment. This will be logged in the history.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for reopening (e.g. Inking is still pixelated)"
            className="min-h-24 bg-background"
            maxLength={1000}
            disabled={isSubmitting}
          />
        </div>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setReason("");
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!reason.trim() || isSubmitting}
          >
            Confirm Reopen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
