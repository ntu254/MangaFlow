import {
  ChevronRight,
  Calendar,
  User,
  Clock,
  Bell,
  CheckSquare,
  MessageSquare,
} from "lucide-react";

export function MangakaRightPanel({ data }: { data?: any }) {
  return (
    <div className="w-full lg:w-[320px] shrink-0 space-y-6">
      {/* Schedule */}
      <div className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-foreground">Today's Schedule</h2>
          <button className="flex items-center gap-1 text-[12px] font-medium text-foreground/60 hover:text-foreground">
            View calendar <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="mb-6 text-[13px] text-foreground/60">May 15, 2025</div>

        {/* Fake week calendar */}
        <div className="mb-6 flex justify-between text-center text-[11px]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
            const isToday = day === "Thu";
            const date = 12 + i;
            return (
              <div key={day} className="flex flex-col gap-1">
                <span className="text-foreground/50">{day}</span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-medium ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}
                >
                  {date}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-foreground/5">
          <div className="relative pl-8">
            <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-background bg-blue-500"></div>
            <div className="text-[12px] font-bold text-foreground/70">10:00</div>
            <div className="mt-1 text-[13px] font-medium text-foreground">
              Review: Vagabond Ch. 327
            </div>
            <div className="text-[12px] text-foreground/60">Page 08 - Background Cleanup</div>
          </div>

          <div className="relative pl-8">
            <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-background bg-blue-500"></div>
            <div className="text-[12px] font-bold text-foreground/70">14:00</div>
            <div className="mt-1 text-[13px] font-medium text-foreground">Team Meeting</div>
            <div className="text-[12px] text-foreground/60">Production Update</div>
          </div>

          <div className="relative pl-8">
            <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-background bg-red-500"></div>
            <div className="text-[12px] font-bold text-red-500">16:00</div>
            <div className="mt-1 text-[13px] font-medium text-foreground">Review: Real Ch. 146</div>
            <div className="text-[12px] text-foreground/60">Page 15 - Speech Bubble</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-[15px] font-bold text-foreground">Recent Activity</h2>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[12px] text-foreground">
                <span className="font-medium">Hiroshi S.</span> submitted work
              </div>
              <div className="text-[11px] text-foreground/60">Vagabond Ch. 327 / Page 08</div>
            </div>
            <div className="ml-auto text-[11px] text-foreground/40">2h ago</div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[12px] text-foreground">You requested revision</div>
              <div className="text-[11px] text-foreground/60">Real Ch. 146 / Page 12</div>
            </div>
            <div className="ml-auto text-[11px] text-foreground/40">3h ago</div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[12px] text-foreground">
                <span className="font-medium">Kenji T.</span> submitted work
              </div>
              <div className="text-[11px] text-foreground/60">Real Ch. 146 / Page 15</div>
            </div>
            <div className="ml-auto text-[11px] text-foreground/40">5h ago</div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[12px] text-foreground">
                <span className="font-medium">Yuta M.</span> submitted work
              </div>
              <div className="text-[11px] text-foreground/60">Slam Dunk Ch. 276 / Page 04</div>
            </div>
            <div className="ml-auto text-[11px] text-foreground/40">1d ago</div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[12px] text-foreground">Chapter 327 is now in production</div>
              <div className="text-[11px] text-foreground/60">Vagabond</div>
            </div>
            <div className="ml-auto text-[11px] text-foreground/40">1d ago</div>
          </div>
        </div>

        <button className="mt-4 flex items-center gap-1 text-[12px] font-medium text-foreground/60 hover:text-foreground">
          View all activity <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-foreground">Notifications</h2>
          <button className="text-[11px] font-medium text-foreground/60 hover:text-foreground">
            Mark all as read
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[12px] text-foreground">New submission requires review</div>
              <div className="text-[11px] text-foreground/60">Vagabond Ch. 327 / Page 08</div>
            </div>
            <div className="ml-auto text-[11px] text-foreground/40">2h ago</div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[12px] text-foreground">You have 3 tasks waiting review</div>
              <div className="text-[11px] text-foreground/60">Review Queue</div>
            </div>
            <div className="ml-auto text-[11px] text-foreground/40">3h ago</div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[12px] text-foreground">Chapter 146 progress updated</div>
              <div className="text-[11px] text-foreground/60">Real</div>
            </div>
            <div className="ml-auto text-[11px] text-foreground/40">5h ago</div>
          </div>
        </div>

        <button className="mt-4 flex items-center gap-1 text-[12px] font-medium text-foreground/60 hover:text-foreground">
          View all notifications <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
