import { MessageSquare } from 'lucide-react'

const PAGE_IMAGE = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80&fit=crop"

export function PageWorkspaceCanvas() {
  return (
    <div className="flex-1 relative overflow-auto p-8 flex justify-center items-start">
      {/* The Image Wrapper */}
      <div className="relative shadow-sm border border-gray-200 bg-white" style={{ width: '600px', height: '850px' }}>
        <img src={PAGE_IMAGE} alt="Canvas" className="w-full h-full object-cover grayscale opacity-90 mix-blend-multiply" />
        
        {/* Simulated Annotations Overlay */}
        
        {/* Region 1: Rectangle */}
        <div className="absolute top-[8%] left-[8%] w-[25%] h-[20%] border-2 border-dashed border-purple-500 bg-purple-500/10 rounded group cursor-pointer hover:bg-purple-500/20">
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-purple-600 text-white rounded text-[12px] font-bold flex items-center justify-center shadow-sm">1</div>
        </div>

        {/* Region 2: Polygon (simulated with CSS transform/clip-path for demo) */}
        <div className="absolute top-[8%] right-[8%] w-[25%] h-[20%] border-2 border-dashed border-blue-500 bg-blue-500/10 rounded group cursor-pointer hover:bg-blue-500/20" style={{ clipPath: 'polygon(20% 0%, 100% 0%, 100% 80%, 80% 100%, 0% 100%, 0% 20%)' }}>
          <div className="absolute top-0 left-0 w-6 h-6 bg-blue-500 text-white rounded text-[12px] font-bold flex items-center justify-center shadow-sm">2</div>
        </div>

        {/* Region 3: Big Panel Rectangle */}
        <div className="absolute top-[38%] left-[4%] w-[92%] h-[25%] border-2 border-emerald-500 bg-emerald-500/5 rounded group cursor-pointer hover:bg-emerald-500/10">
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-emerald-500 text-white rounded text-[12px] font-bold flex items-center justify-center shadow-sm">3</div>
        </div>

        {/* Region 4: Bottom Left */}
        <div className="absolute bottom-[5%] left-[4%] w-[28%] h-[30%] border-2 border-dashed border-orange-500 bg-orange-500/10 rounded-lg group cursor-pointer hover:bg-orange-500/20">
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-orange-500 text-white rounded text-[12px] font-bold flex items-center justify-center shadow-sm">4</div>
        </div>

        {/* Region 5: Bottom Middle */}
        <div className="absolute bottom-[5%] left-[34%] w-[28%] h-[30%] border-2 border-dashed border-purple-500 bg-purple-500/10 rounded-full group cursor-pointer hover:bg-purple-500/20">
          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 text-white rounded text-[12px] font-bold flex items-center justify-center shadow-sm">5</div>
        </div>

        {/* Region 6: Bottom Right */}
        <div className="absolute bottom-[5%] right-[4%] w-[32%] h-[30%] border-2 border-dashed border-yellow-500 bg-yellow-500/10 rounded-lg group cursor-pointer hover:bg-yellow-500/20">
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-yellow-500 text-white rounded text-[12px] font-bold flex items-center justify-center shadow-sm text-gray-900">6</div>
        </div>

        {/* Region 7: Comment Pin */}
        <div className="absolute bottom-[18%] left-[40%] w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform">
          <span className="text-[13px] font-bold">7</span>
          <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 text-gray-600">
            <MessageSquare size={10} />
          </div>
        </div>
      </div>
    </div>
  )
}
