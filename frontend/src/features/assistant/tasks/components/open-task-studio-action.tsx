import type { StudioTask } from "@/entities/series/model/studio-types";
import { Link, useNavigate } from "@tanstack/react-router";
import { type MouseEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useStudioTaskActionMutation } from "../../api/assistant-queries";

type Props = {
  task: StudioTask;
  className?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  children: ReactNode;
};

export function OpenTaskStudioAction({ task, className, onClick, children }: Props) {
  const navigate = useNavigate();
  const mutation = useStudioTaskActionMutation(task.id);

  if (
    task.assignmentStatus === "PENDING" ||
    task.assignmentStatus === "REJECTED" ||
    task.status !== "TODO"
  ) {
    return (
      <Link
        to="/app/assistant/tasks/$taskId/studio"
        params={{ taskId: task.id }}
        onClick={onClick}
        className={className}
      >
        {children}
      </Link>
    );
  }

  const startAndOpen = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(e);
    mutation.mutate(
      { action: "start", chapterId: task.chapterId, pageId: task.pageId },
      {
        onSuccess: () => {
          toast.success("Task started.");
          navigate({
            to: "/app/assistant/tasks/$taskId/studio",
            params: { taskId: task.id },
          });
        },
        onError: () => toast.error("Could not start the task."),
      },
    );
  };

  return (
    <button
      type="button"
      onClick={startAndOpen}
      disabled={mutation.isPending}
      className={className}
    >
      {mutation.isPending ? "Starting..." : children}
    </button>
  );
}
