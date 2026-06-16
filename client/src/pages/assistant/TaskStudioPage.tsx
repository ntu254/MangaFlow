import { useParams } from 'react-router-dom'

export default function TaskStudioPage() {
  const { taskId } = useParams()

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 bg-white overflow-hidden items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Task Studio</h1>
        <p className="text-gray-500">Working on task ID: {taskId}</p>
        <p className="text-sm text-gray-400 mt-2">Task specific canvas and tools will be loaded here.</p>
      </div>
    </div>
  )
}
