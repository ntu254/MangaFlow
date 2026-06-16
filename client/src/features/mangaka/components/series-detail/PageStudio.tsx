import { useState } from 'react'
import { PageStudioHeader } from './page-studio/PageStudioHeader'
import { PageStudioSidebar } from './page-studio/PageStudioSidebar'
import { PageStudioToolbar } from './page-studio/PageStudioToolbar'
import { PageStudioCanvas } from './page-studio/PageStudioCanvas'
import { PageStudioRightPanel } from './page-studio/PageStudioRightPanel'

export function PageStudio({ onBack }: { onBack: () => void }) {
  const [leftTab, setLeftTab] = useState<'pages' | 'layers'>('pages')
  const [rightTab, setRightTab] = useState<'task' | 'comments'>('task')

  return (
    <div className="flex flex-col w-full h-full flex-1 bg-white overflow-hidden border-t border-gray-200">
      
      {/* Header */}
      <PageStudioHeader onBack={onBack} />

      {/* Main 3-Column Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Column: Sidebar (Pages/Layers) */}
        <PageStudioSidebar leftTab={leftTab} setLeftTab={setLeftTab} />

        {/* Middle Column: Canvas & Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
          
          {/* Toolbar */}
          <PageStudioToolbar />

          {/* Canvas Area */}
          <PageStudioCanvas />

        </div>

        {/* Right Column: Task Creation & Comments */}
        <PageStudioRightPanel rightTab={rightTab} setRightTab={setRightTab} />

      </div>

    </div>
  )
}
