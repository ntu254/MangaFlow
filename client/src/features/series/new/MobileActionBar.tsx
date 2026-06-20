import { Loader2 } from "lucide-react";

interface Props {
  canSaveDraft: boolean;
  canSubmit: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function MobileActionBar(p: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-foreground/10 bg-background/95 p-3 backdrop-blur md:hidden">

      <button
        type="button"
        onClick={p.onSubmit}
        disabled={!p.canSubmit || p.isSaving || p.isSubmitting}
        className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-foreground text-[13px] font-semibold text-background disabled:opacity-40"
      >
        {p.isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Submit
      </button>
    </div>
  );
}
