import { useState } from "react"
import { useParams } from "react-router-dom"
import { X } from "lucide-react"
import {
  useCreateTask,
  useTaskTypes,
  useEligibleAssistants,
} from "@/hooks/useMangakaTasks"
import type { TaskPriority } from "@/api/task"

interface AssignTaskModalProps {
  isOpen: boolean
  onClose: () => void
  chapterId: string
  pageId: string
  regionId?: string
  defaultTitle?: string
}

export function AssignTaskModal({
  isOpen,
  onClose,
  chapterId,
  pageId,
  regionId,
  defaultTitle = "New Task",
}: AssignTaskModalProps) {
  const { id: seriesId } = useParams()
  
  const [taskTypeId, setTaskTypeId] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [title, setTitle] = useState(defaultTitle)
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("NORMAL")
  const [dueDate, setDueDate] = useState("")

  const { data: taskTypes = [], isLoading: isLoadingTypes } = useTaskTypes()
  const { data: assistants = [], isLoading: isLoadingAssistants } = useEligibleAssistants(seriesId || "")
  const createTask = useCreateTask(seriesId || "")

  if (!isOpen || !seriesId) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!taskTypeId || !assignedTo || !title || !dueDate) {
      return
    }

    createTask.mutate(
      {
        seriesId,
        chapterId,
        pageId,
        regionId,
        taskTypeId,
        assignedTo,
        title,
        description,
        priority,
        dueDate: new Date(dueDate).toISOString(),
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Assign Task</h2>
            <p className="text-sm text-gray-500 font-medium mt-0.5">
              {regionId ? "Assigning task to region" : "Assigning task to page"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Task Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={taskTypeId}
                onChange={(e) => setTaskTypeId(e.target.value)}
                disabled={isLoadingTypes}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:opacity-60"
              >
                <option value="">Select a task type</option>
                {taskTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Assignee <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={isLoadingAssistants}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:opacity-60"
              >
                <option value="">Select an assistant</option>
                {assistants.map((assistant) => (
                  <option key={assistant.user.id} value={assistant.user.id}>
                    {assistant.user.name} ({assistant.user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clean up lineart for panel 2"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, instructions, or references..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors text-sm shadow-sm disabled:opacity-60 flex items-center justify-center min-w-[120px]"
            >
              {createTask.isPending ? "Assigning..." : "Assign Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
