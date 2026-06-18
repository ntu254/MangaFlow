import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"
import { Loader2 } from "lucide-react"

interface ReviewActionModalProps {
  isOpen: boolean
  onClose: () => void
  actionType: "approve" | "revision" | "reject" | null
  onSubmit: (note: string) => void
  isSubmitting?: boolean
}

export function ReviewActionModal({ isOpen, onClose, actionType, onSubmit, isSubmitting }: ReviewActionModalProps) {
  const [note, setNote] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (actionType !== "approve" && !note.trim()) {
      return // Must provide feedback, browser required should catch this but just in case
    }
    onSubmit(note.trim())
  }

  if (!actionType) return null

  const config = {
    approve: {
      title: "Approve Submission",
      desc: "This will approve the page. You can optionally leave a note for the assistant.",
      buttonText: "Approve",
      variant: "default" as const,
      buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white"
    },
    revision: {
      title: "Request Revision",
      desc: "Provide clear feedback on what needs to be changed.",
      buttonText: "Request Revision",
      variant: "destructive" as const,
      buttonClass: "bg-amber-600 hover:bg-amber-700 text-white"
    },
    reject: {
      title: "Reject Submission",
      desc: "Rejecting this submission will close the task. Explain why it is being rejected.",
      buttonText: "Reject",
      variant: "destructive" as const,
      buttonClass: "bg-rose-600 hover:bg-rose-700 text-white"
    }
  }[actionType]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
            <DialogDescription>{config.desc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="note" className={actionType !== "approve" ? "after:content-['*'] after:ml-0.5 after:text-rose-500" : ""}>
                Feedback Note
              </Label>
              <Textarea
                id="note"
                placeholder={actionType === "approve" ? "Great job! (Optional)" : "Please fix the background shading..."}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required={actionType !== "approve"}
                className="resize-none"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className={config.buttonClass} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                config.buttonText
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
