import { Wallet, CheckCircle2, ArrowRight } from 'lucide-react'

export function PayrollSnapshot() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/30 rounded-t-xl">
        <h2 className="text-sm font-bold text-gray-900">Payroll Snapshot</h2>
        <a href="#" className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
          View payroll <ArrowRight size={12}/>
        </a>
      </div>
      <div className="flex flex-col justify-center flex-1 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Wallet size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">May 2025</span>
              <span className="text-[11px] font-medium text-gray-500">Payroll Period</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-gray-900">$3,250.00</span>
            <span className="text-[11px] text-gray-500">Estimated Earnings</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
              <CheckCircle2 size={12} /> Ready to Confirm
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Due May 31, 2025</span>
          </div>
        </div>
      </div>
    </div>
  )
}
