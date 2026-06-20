import { Settings, ExternalLink, Plus, CheckCircle2 } from "lucide-react";

export interface PageTask {
  name: string;
  status: string;
  by: string;
  time: string;
}

interface SelectedPageDetailProps {
  selectedPage: number;
  tasks: PageTask[];
}

export function SelectedPageDetail({ selectedPage, tasks }: SelectedPageDetailProps) {
  return (
    <section className="rounded-xl border border-foreground/10 bg-card p-5 lg:p-6 shadow-sm relative">
      <div className="absolute top-4 right-4">
        <button className="h-7 w-7 flex items-center justify-center rounded-md border border-foreground/10 text-foreground/50 hover:bg-foreground/5 transition-colors shadow-sm">
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-[18px] font-extrabold text-foreground tracking-tight">
          Selected Page {String(selectedPage).padStart(2, "0")}
        </h2>
        <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
          UNDER REVIEW
        </div>
      </div>

      <div className="text-[12px] font-medium text-foreground/50 mb-4 flex items-center gap-2">
        <span>{tasks.length} active tasks</span>
        <span className="w-1 h-1 rounded-full bg-foreground/20" />
        <span>Last updated 1h ago</span>
      </div>

      <div className="flex gap-2.5 mb-6 w-max">
        <button className="h-8 px-4 rounded-md bg-[#061A2B] text-white dark:bg-blue-600 text-[11px] font-bold shadow-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow transition-all">
          Open Page Studio <ExternalLink className="h-3 w-3" />
        </button>
        <button className="h-8 px-4 rounded-md border border-foreground/15 bg-card text-[11px] font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-foreground/5 transition-colors">
          <Plus className="h-3 w-3" /> Assign task
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 flex justify-center">
              {task.status === "Completed" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : task.status === "In Review" ? (
                <div className="h-4 w-4 rounded-full border-2 border-blue-500 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                </div>
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-orange-500 border-r-transparent"></div>
              )}
            </div>
            <div className="flex-1 text-[12px] font-bold text-foreground truncate">{task.name}</div>
            <div
              className={`text-[10px] font-bold w-20 ${
                task.status === "Completed"
                  ? "text-emerald-600"
                  : task.status === "In Review"
                    ? "text-blue-600"
                    : "text-orange-600"
              }`}
            >
              {task.status}
            </div>
            <div className="text-[10px] font-medium text-foreground/50 w-24 flex items-center justify-between">
              <span>by {task.by}</span>
              <span>{task.time}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
