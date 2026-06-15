import { useState } from 'react'
import { PageWorkspaceHeader } from './page-workspace/PageWorkspaceHeader'
import { PageWorkspaceSidebar } from './page-workspace/PageWorkspaceSidebar'
import { PageWorkspaceToolbar } from './page-workspace/PageWorkspaceToolbar'
import { PageWorkspaceCanvas } from './page-workspace/PageWorkspaceCanvas'
import { PageWorkspaceRightPanel } from './page-workspace/PageWorkspaceRightPanel'

export function PageWorkspace({ onBack }: { onBack: () => void }) {
  const [leftTab, setLeftTab] = useState<'pages' | 'layers'>('pages')
  const [rightTab, setRightTab] = useState<'task' | 'comments'>('task')

  return (
    <div className="flex flex-col w-full h-full flex-1 bg-white overflow-hidden border-t border-gray-200">
      
      {/* Header */}
      <PageWorkspaceHeader onBack={onBack} />

      {/* Main 3-Column Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Column: Sidebar (Pages/Layers) */}
        <PageWorkspaceSidebar leftTab={leftTab} setLeftTab={setLeftTab} />

        {/* Middle Column: Canvas & Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
          
          {/* Toolbar */}
          <PageWorkspaceToolbar />

          {/* Canvas Area */}
          <PageWorkspaceCanvas />

        </div>

        {/* Right Column: Task Creation & Comments */}
        <PageWorkspaceRightPanel rightTab={rightTab} setRightTab={setRightTab} />

      </div>

    </div>
  )
}
