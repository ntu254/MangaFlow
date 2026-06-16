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
import { PageStudio } from "./PageStudio";

export function PagesTab() {
  const [activeTab, setActiveTab] = useState("chapter");

  if (activeTab === "pages") {
    return <PageStudio onBack={() => setActiveTab("chapter")} />;
  }

  return (
    <div className="flex flex-col w-full h-full gap-6 px-8 py-6 max-w-[1600px] mx-auto">
      {/* Hub Header */}
      <div className="flex flex-col mb-4">
        <h1 className="text-[28px] font-black text-gray-900 tracking-tight leading-tight mb-2">
          Production Hub
        </h1>
        <p className="text-[14px] text-gray-500 font-medium mb-6">
          Manage chapters, pages, tasks, and track production progress.
        </p>

        <div className="flex items-center justify-between border-b border-gray-200 pb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-[12px] font-bold border border-emerald-100 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Ongoing
              </span>
              <span className="text-[14px] font-extrabold text-gray-900">
                Eclipse of Eternity
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-[14px] font-medium text-gray-600">
                Chapter 12
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
               <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Target Publish:</span>
               <span className="text-[13px] font-bold text-gray-900">Jun 15, 2024</span>
             </div>
          </div>
        </div>

        {/* Hub Sub-tabs */}
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
            label="Page Studio"
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

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-10">
        {/* Left Column: Chapters Sidebar */}
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

        {/* Main Column: Chapter Details */}
        <div className="lg:col-span-9 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
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
              <button className="flex items-center gap-2 text-[12px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                <UploadCloud size={14} /> Upload Page
              </button>
              <button className="flex items-center gap-2 text-[12px] font-bold text-gray-600 hover:text-gray-900 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                <Settings size={14} /> Settings
              </button>
              <button className="flex items-center gap-2 text-[12px] font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm">
                Open Chapter Production <ExternalLink size={14} />
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
          <div className="grid grid-cols-5 gap-4 mb-6">
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
          </div>

          {/* Footer Grid */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <span className="text-[12px] font-medium text-gray-500">
              Showing 1 - 10 of 48 pages
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


