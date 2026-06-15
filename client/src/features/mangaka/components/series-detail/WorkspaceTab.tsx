import {
  ArrowRight,
  Check,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Settings,
  UploadCloud,
} from "lucide-react";
import { useState } from "react";
import { PageWorkspace } from "./PageWorkspace";

export function WorkspaceTab() {
  const [activeTab, setActiveTab] = useState("chapter");

  if (activeTab === "pages") {
    return <PageWorkspace onBack={() => setActiveTab("chapter")} />;
  }

  return (
    <div className="flex flex-col w-full h-full gap-6 px-8 py-6 max-w-[1600px] mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col mb-4">
        <h1 className="text-[28px] font-black text-gray-900 tracking-tight leading-tight mb-2">
          Workspace
        </h1>
        <p className="text-[14px] text-gray-500 font-medium mb-6">
          Manage chapters, pages, tasks, and track production progress.
        </p>

        <div className="flex items-center justify-between border-b border-gray-200 pb-8">
          <div className="flex items-center gap-12">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Series
              </span>
              <span className="text-[14px] font-extrabold text-gray-900">
                Eclipse of Eternity
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Current Chapter
              </span>
              <span className="text-[14px] font-extrabold text-gray-900">
                Chapter 12
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Status
              </span>
              <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-100 w-fit">
                Ongoing
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Next Milestone
              </span>
              <span className="text-[14px] font-extrabold text-gray-900">
                Publish Ch. 12
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Target Publish Date
              </span>
              <span className="text-[14px] font-extrabold text-gray-900">
                Jun 15, 2024
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <Stepper />
          </div>
        </div>

        {/* Workspace Sub-tabs */}
        <div className="flex items-center gap-8 pt-4">
          <TabButton
            icon={<FileText size={16} />}
            label="Chapter Overview"
            active={activeTab === "chapter"}
            onClick={() => setActiveTab("chapter")}
          />
          <TabButton
            label="Task Board"
            active={activeTab === "tasks"}
            onClick={() => setActiveTab("tasks")}
          />
          <TabButton
            label="Page Workspace"
            badge="12"
            active={activeTab === "pages"}
            onClick={() => setActiveTab("pages")}
          />
          <TabButton
            label="Submissions"
            badge="3"
            badgeColor="purple"
            active={activeTab === "submissions"}
            onClick={() => setActiveTab("submissions")}
          />
          <TabButton
            label="Comments"
            badge="5"
            badgeColor="purple"
            active={activeTab === "comments"}
            onClick={() => setActiveTab("comments")}
          />
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-10">
        {/* Left Column: Chapters */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[16px] font-extrabold text-gray-900">
              Chapters
            </h2>
            <button className="text-[12px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors">
              <Plus size={14} /> Create Chapter
            </button>
          </div>

          <ChapterCard
            ch="12"
            status="In Progress"
            pages="48 / 60"
            pct={80}
            target="Jun 15, 2024"
            tasks="18 pending"
            active
          />
          <ChapterCard
            ch="11"
            status="Completed"
            pages="60 / 60"
            pct={100}
            target="May 20, 2024"
            tasks=""
          />
          <ChapterCard
            ch="10"
            status="Completed"
            pages="60 / 60"
            pct={100}
            target="May 5, 2024"
            tasks=""
          />
          <ChapterCard
            ch="9"
            status="Completed"
            pages="60 / 60"
            pct={100}
            target="Apr 20, 2024"
            tasks=""
          />
          <ChapterCard
            ch="8"
            status="In Progress"
            pages="30 / 60"
            pct={50}
            target="Apr 30, 2024"
            tasks="10 pending"
          />

          <button className="text-[13px] font-bold text-purple-600 hover:text-purple-700 mt-2 flex items-center gap-1">
            View all chapters <ArrowRight size={14} />
          </button>
        </div>

        {/* Middle Column: Chapter Details */}
        <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-extrabold text-gray-900">
                Chapter 12
              </h2>
              <span className="bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded text-[11px] font-bold">
                In Progress
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 text-[12px] font-bold text-gray-600 hover:text-gray-900 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                <Settings size={14} /> Chapter Settings
              </button>
              <button className="flex items-center gap-2 text-[12px] font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm">
                Open Chapter Workspace <ExternalLink size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-gray-500">Pages</span>
              <span className="text-[16px] font-extrabold text-gray-900">
                48 / 60
              </span>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{ width: "80%" }}
                ></div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-gray-500">Tasks</span>
              <span className="text-[16px] font-extrabold text-gray-900">
                42 / 60
              </span>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-orange-500 h-full rounded-full"
                  style={{ width: "70%" }}
                ></div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-gray-500">
                Pending Mangaka Review
              </span>
              <span className="text-[16px] font-extrabold text-gray-900">
                18
              </span>
              <button className="text-[11px] font-bold text-purple-600 mt-1 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-gray-500">
                Blocking Issues
              </span>
              <span className="text-[16px] font-extrabold text-red-600">2</span>
              <button className="text-[11px] font-bold text-purple-600 mt-1 flex items-center gap-1">
                View issues <ArrowRight size={12} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
            <button className="font-bold text-[13px] text-purple-600 border-b-2 border-purple-600 pb-3">
              Pages (48)
            </button>
            <button className="font-bold text-[13px] text-gray-500 hover:text-gray-900 border-b-2 border-transparent pb-3 transition-colors">
              Tasks (42)
            </button>
            <button className="font-bold text-[13px] text-gray-500 hover:text-gray-900 border-b-2 border-transparent pb-3 transition-colors">
              Activity
            </button>

            <div className="ml-auto flex items-center gap-3 pb-3">
              <select className="text-[12px] font-bold text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 outline-none shadow-sm cursor-pointer">
                <option>All Status</option>
              </select>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pages..."
                  className="text-[12px] font-medium text-gray-600 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 outline-none shadow-sm w-40"
                />
                <svg
                  className="absolute left-2.5 top-2 text-gray-400"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <button className="flex items-center gap-2 text-[12px] font-bold text-purple-600 bg-purple-50 border border-purple-100 rounded-lg px-3 py-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Grid
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <PageCard num="1" status="Approved" statColor="emerald" />
            <PageCard num="2" status="Approved" statColor="emerald" />
            <PageCard num="3" status="Approved" statColor="emerald" />
            <PageCard num="4" status="Approved" statColor="emerald" />
            <PageCard num="5" status="In Progress" statColor="orange" />
            <PageCard num="6" status="In Progress" statColor="orange" />
            <PageCard num="7" status="In Progress" statColor="orange" />
            <PageCard num="8" status="Needs Fix" statColor="red" />
            <PageCard num="9" status="Pending Review" statColor="yellow" />
            <PageCard num="10" status="Pending Review" statColor="yellow" />
            <PageCard num="11" status="Not Started" statColor="gray" />
            <PageCard num="12" status="Not Started" statColor="gray" />
          </div>

          {/* Footer Grid */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <span className="text-[12px] font-medium text-gray-500">
              Showing 1 - 12 of 48 pages
            </span>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 border border-gray-200 rounded">
                <ChevronRight size={14} className="rotate-180" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-purple-600 bg-purple-50 border border-purple-200 rounded font-bold text-[13px]">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 border border-gray-200 rounded font-bold text-[13px]">
                2
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 border border-gray-200 rounded font-bold text-[13px]">
                3
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 border border-gray-200 rounded font-bold text-[13px]">
                4
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-900 border border-gray-200 rounded">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
            <div className="flex gap-4 text-[11px] font-medium text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>{" "}
                Tasks
              </span>
              <span className="flex items-center gap-1.5">
                <UploadCloud size={12} /> Submissions
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle size={12} /> Comments
              </span>
            </div>
            <div className="flex gap-4 text-[11px] font-bold text-gray-600">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{" "}
                Approved
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div> In
                Progress
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> Needs
                Fix
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>{" "}
                Pending Review
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div> Not
                Started
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg text-[11px] font-bold uppercase flex items-center justify-between w-full shadow-sm cursor-pointer hover:bg-emerald-100 transition-colors">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{" "}
              Current Context: Production
            </span>
            <ArrowRight size={14} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wider mb-5">
              Production Progress
            </h3>
            <div className="flex gap-4 items-center mb-2">
              <div className="w-20 h-20 rounded-full border-8 border-gray-100 flex items-center justify-center relative shrink-0">
                {/* Simulated donutchart fill */}
                <div className="absolute inset-0 rounded-full border-8 border-purple-500 border-r-transparent border-t-transparent -rotate-45"></div>
                <div className="flex flex-col items-center">
                  <span className="text-[14px] font-black text-gray-900 leading-tight">
                    72%
                  </span>
                  <span className="text-[8px] font-bold text-gray-500 uppercase">
                    Completed
                  </span>
                </div>
              </div>
              <div className="flex flex-col flex-1 gap-2">
                <ProgressRow
                  label="Pages Uploaded"
                  val="48/60"
                  color="purple"
                />
                <ProgressRow
                  label="Tasks Completed"
                  val="86/120"
                  color="blue"
                />
                <ProgressRow
                  label="Ready for Editor"
                  val="18/60"
                  color="orange"
                />
                <ProgressRow label="Pending Review" val="12/60" color="red" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wider">
                Submissions Needing Your Review
              </h3>
              <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold">
                3
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <ReviewItem page="18" time="2h ago" />
              <ReviewItem page="19" time="5h ago" />
              <ReviewItem page="21" time="1d ago" user="Han Lee" />
              <button className="text-[12px] font-bold text-purple-600 flex items-center gap-1 hover:text-purple-700 mt-2">
                View all submissions <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wider mb-4">
              Publication Readiness
            </h3>
            <div className="flex flex-col gap-3">
              <CheckItem text="All pages uploaded" />
              <CheckItem text="All tasks approved" val="42 / 60" pending />
              <CheckItem
                text="All submissions approved"
                val="30 / 48"
                pending
              />
              <CheckItem text="All comments resolved" val="5 / 48" pending />
              <CheckItem text="Editor final approval" blank />
              <CheckItem text="Publication date set" />
              <button className="text-[12px] font-bold text-purple-600 flex items-center gap-1 hover:text-purple-700 mt-2">
                View details <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <ActionBtn
                icon={<UploadCloud size={16} />}
                label="Upload New Page"
              />
              <ActionBtn
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                }
                label="Create New Task"
              />
              <ActionBtn
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                }
                label="Assign Assistant"
              />
              <ActionBtn
                icon={<Eye size={16} />}
                label="View All Submissions"
              />
              <ActionBtn
                icon={<MessageCircle size={16} />}
                label="Add Comment"
              />
              <ActionBtn
                icon={<Settings size={16} />}
                label="Chapter Settings"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ icon, label, badge, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`font-bold text-[14px] border-b-[3px] pb-3 flex items-center gap-2 transition-colors ${active ? "text-purple-600 border-purple-600" : "text-gray-500 hover:text-gray-900 border-transparent"}`}
    >
      {icon} {label}
      {badge && (
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${active ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}
        >
          {badge}
        </div>
      )}
    </button>
  );
}

function Stepper() {
  return (
    <div className="flex items-center gap-2 relative">
      <div className="absolute top-[13px] left-[14px] right-[14px] h-[2px] bg-gray-200 -z-10"></div>
      <div className="absolute top-[13px] left-[14px] w-1/4 h-[2px] bg-emerald-500 -z-10"></div>
      <div className="absolute top-[13px] left-[calc(25%+14px)] w-[10%] h-[2px] bg-purple-500 -z-10"></div>

      <StepItem label="Approved" state="done" />
      <div className="w-16"></div>
      <StepItem label="Production" state="active" />
      <div className="w-16"></div>
      <StepItem label="All Tasks Approved" state="pending" />
      <div className="w-12"></div>
      <StepItem label="Editor Final Approval" state="pending" />
      <div className="w-12"></div>
      <StepItem label="Published" state="pending" />
    </div>
  );
}

function StepItem({ label, state }: any) {
  return (
    <div className="flex flex-col items-center gap-2 bg-white">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white ${state === "done" ? "border-emerald-500 text-emerald-500" : state === "active" ? "border-purple-600 border-[3px]" : "border-gray-300"}`}
      >
        {state === "done" ? (
          <Check size={14} strokeWidth={3} />
        ) : state === "active" ? (
          <div className="w-2.5 h-2.5 bg-purple-600 rounded-full"></div>
        ) : (
          <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
        )}
      </div>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider text-center max-w-[80px] leading-tight ${state === "done" || state === "active" ? "text-gray-900" : "text-gray-400"}`}
      >
        {label}
      </span>
    </div>
  );
}

function ChapterCard({ ch, status, pages, pct, target, tasks, active }: any) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all relative overflow-hidden ${active ? "border-purple-200 bg-purple-50/30" : "border-gray-200 hover:border-purple-200"}`}
    >
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[14px] font-extrabold text-gray-900">
          Ch. {ch}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-purple-100 text-purple-700 border-purple-200"}`}
        >
          {status}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex justify-between items-end">
          <span className="text-[12px] font-bold text-gray-600">
            Pages: {pages}
          </span>
          <span className="text-[11px] font-bold text-gray-500">{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`${status === "Completed" ? "bg-emerald-500" : "bg-purple-600"} h-full rounded-full`}
            style={{ width: `${pct}%` }}
          ></div>
        </div>
      </div>
      <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
        <span>
          {status === "Completed" ? "Published:" : "Target:"} {target}
        </span>
        {tasks && <span className="text-orange-500">{tasks}</span>}
      </div>
    </div>
  );
}

function PageCard({ num, status, statColor }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    red: "bg-red-50 text-red-600 border-red-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col hover:border-purple-300 hover:shadow-md transition-all cursor-pointer relative group">
      <div className="absolute top-4 left-4 w-4 h-4 rounded border border-gray-300 bg-white shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"></div>
      <button className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded p-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal size={14} />
      </button>

      <div className="w-full aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden mb-3 border border-gray-100 relative">
        <img
          src={`https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80&fit=crop`}
          alt={`Page ${num}`}
          className="w-full h-full object-cover grayscale opacity-80 mix-blend-multiply"
        />
      </div>

      <span className="text-[13px] font-extrabold text-gray-900 mb-2">
        Page {num}
      </span>
      <span
        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border w-fit mb-3 ${colors[statColor]}`}
      >
        {status}
      </span>

      <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 mt-auto">
        <span className="flex items-center gap-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>{" "}
          3
        </span>
        <span className="flex items-center gap-1">
          <UploadCloud size={12} /> {Math.floor(Math.random() * 3)}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={12} /> {Math.floor(Math.random() * 2)}
        </span>
      </div>
    </div>
  );
}

function ProgressRow({ label, val, color }: any) {
  const bgClasses: any = {
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${bgClasses[color]}`}></div>
        <span className="text-[11px] font-bold text-gray-600">{label}</span>
      </div>
      <span className="text-[12px] font-extrabold text-gray-900">{val}</span>
    </div>
  );
}

function ReviewItem({ page, time, user = "Yuki Tanaka" }: any) {
  return (
    <div className="flex gap-3 items-center">
      <div className="w-12 h-16 bg-gray-100 rounded border border-gray-200 overflow-hidden shrink-0">
        <img
          src={`https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=100&q=80&fit=crop`}
          alt=""
          className="w-full h-full object-cover grayscale opacity-80 mix-blend-multiply"
        />
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-[13px] font-bold text-gray-900">Page {page}</span>
        <span className="text-[11px] font-medium text-gray-500">
          {user} · {time}
        </span>
      </div>
      <span className="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded uppercase max-w-[80px] text-center">
        Pending Mangaka Review
      </span>
    </div>
  );
}

function CheckItem({ text, val, blank, pending }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className={`w-4 h-4 rounded-full flex items-center justify-center border ${blank ? "border-gray-300" : "border-emerald-500 bg-emerald-50 text-emerald-500"}`}
        >
          {!blank && <Check size={10} strokeWidth={3} />}
        </div>
        <span className="text-[12px] font-bold text-gray-600">{text}</span>
      </div>
      {val && (
        <span
          className={`text-[12px] font-extrabold ${pending ? "text-orange-500" : "text-gray-900"}`}
        >
          {val}
        </span>
      )}
    </div>
  );
}

function ActionBtn({ icon, label }: any) {
  return (
    <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 hover:shadow-sm transition-all group text-gray-500 hover:text-purple-600 h-[80px]">
      <div className="text-gray-400 group-hover:text-purple-600 transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-center leading-tight max-w-[60px]">
        {label}
      </span>
    </button>
  );
}
