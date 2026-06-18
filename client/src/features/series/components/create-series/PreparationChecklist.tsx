import { FileText, Image as ImageIcon, Users, LayoutDashboard, Briefcase } from 'lucide-react'

export function PreparationChecklist() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col w-full">
      <h3 className="text-sm font-bold text-violet-700 mb-1">What to Prepare</h3>
      <p className="text-[12px] text-slate-500 mb-6">Prepare the following materials for submission.</p>

      <div className="flex flex-col gap-4">
        <ChecklistItem 
          icon={<FileText size={16} className="text-rose-500" />}
          iconBg="bg-rose-50 border-rose-100"
          title="Proposal Manuscript (PDF)"
          desc="Full story proposal and synopsis"
          badge="Required"
        />
        <ChecklistItem 
          icon={<ImageIcon size={16} className="text-blue-500" />}
          iconBg="bg-blue-50 border-blue-100"
          title="Sample Pages"
          desc="Or upload page images instead"
          badge="Required"
        />
        <ChecklistItem 
          icon={<Users size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50 border-emerald-100"
          title="Character Concepts"
          desc="Character designs and references"
          badge="Optional"
        />
        <ChecklistItem 
          icon={<LayoutDashboard size={16} className="text-amber-500" />}
          iconBg="bg-amber-50 border-amber-100"
          title="Cover Draft"
          desc="Draft cover or key visual"
          badge="Optional"
        />
        <ChecklistItem 
          icon={<Briefcase size={16} className="text-violet-500" />}
          iconBg="bg-violet-50 border-violet-100"
          title="Reference Images"
          desc="World, locations, mood, etc."
          badge="Optional"
        />
      </div>
    </div>
  )
}

function ChecklistItem({ icon, iconBg, title, desc, badge }: { icon: React.ReactNode, iconBg: string, title: string, desc: string, badge: string }) {
  const isRequired = badge === 'Required';
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${iconBg}`}>
        {icon}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[13px] font-bold text-slate-900 truncate">{title}</span>
        <span className="text-[11px] text-slate-500 truncate">{desc}</span>
      </div>
      <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${isRequired ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
        {badge}
      </div>
    </div>
  )
}
