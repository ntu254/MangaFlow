import { Check } from 'lucide-react'

export function ReviewProgress({ status }: { status: string }) {
  const currentStep = getCurrentStep(status)
  const steps = [
    { id: 1, name: 'Draft Completed' },
    { id: 2, name: 'Submitted to Editor' },
    { id: 3, name: 'Editor Review In Progress' },
    { id: 4, name: 'Board Review Pending' },
    { id: 5, name: 'Final Decision Pending' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col w-full shadow-sm">
      <h2 className="text-sm font-bold text-gray-900 mb-8">Review Progress</h2>
      
      <div className="relative flex justify-between px-4">
        {/* Connecting Line */}
        <div className="absolute top-4 left-8 right-8 h-[2px] bg-gray-100 -z-10"></div>
        <div className="absolute top-4 left-8 w-[40%] h-[2px] bg-purple-200 -z-10 border-t-2 border-dashed border-purple-400"></div>

        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-3 w-20">
            {(() => {
              const stepStatus = step.id < currentStep ? 'completed' : step.id === currentStep ? 'current' : 'upcoming'
              return (
                <>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold z-10 border-2 transition-colors ${
              stepStatus === 'completed' ? 'bg-purple-600 border-purple-600 text-white' : 
              stepStatus === 'current' ? 'bg-white border-purple-600 text-purple-600' : 
              'bg-white border-gray-200 text-gray-400'
            }`}>
              {stepStatus === 'completed' ? <Check size={16} strokeWidth={3} /> : step.id}
            </div>
            <span className={`text-[11px] text-center leading-tight font-medium ${
              stepStatus === 'completed' ? 'text-gray-900' :
              stepStatus === 'current' ? 'text-purple-700 font-bold' :
              'text-gray-400'
            }`}>
              {step.name}
            </span>
                </>
              )
            })()}
          </div>
        ))}
      </div>
    </div>
  )
}

function getCurrentStep(status: string) {
  if (['APPROVED', 'ONGOING', 'AT_RISK', 'COMPLETED'].includes(status)) return 5
  if (['BOARD_REVIEW', 'BOARD_REVIEWING'].includes(status)) return 4
  if (['SUBMITTED', 'EDITOR_REVIEW', 'REVISION_REQUESTED'].includes(status)) return 3
  return 1
}
