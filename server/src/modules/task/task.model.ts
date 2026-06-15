import mongoose, { Schema, type Document } from "mongoose"
import { TASK_STATUSES, TASK_PRIORITIES, TASK_CURRENCIES, type TaskStatus, type TaskPriority, type TaskCurrency } from "../../shared/workflow/status.js"

export interface TaskTypeDocument extends Document {
  name: string
  code: string
  description?: string
  baseRate: number
  currency: TaskCurrency
  isActive: boolean
  allowRegionTask: boolean
  allowPageTask: boolean
  requiresFileSubmission: boolean
  requiresTextSubmission: boolean
  sortOrder?: number
  createdAt: Date
  updatedAt: Date
}

const taskTypeSchema = new Schema<TaskTypeDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500 },
    baseRate: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: TASK_CURRENCIES, required: true, default: "POINT" },
    isActive: { type: Boolean, default: true, index: true },
    allowRegionTask: { type: Boolean, required: true, default: true },
    allowPageTask: { type: Boolean, required: true, default: true },
    requiresFileSubmission: { type: Boolean, required: true, default: true },
    requiresTextSubmission: { type: Boolean, required: true, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
)

taskTypeSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    delete ret.__v
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export const TaskType = mongoose.model<TaskTypeDocument>("TaskType", taskTypeSchema)

export interface TaskDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  chapterId: mongoose.Types.ObjectId
  pageId?: mongoose.Types.ObjectId
  regionId?: mongoose.Types.ObjectId
  taskTypeId: mongoose.Types.ObjectId
  assignedTo: mongoose.Types.ObjectId
  assignedBy: mongoose.Types.ObjectId
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  baseRate: number
  dueDate: Date
  contextPageIds: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const taskSchema = new Schema<TaskDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true, index: true },
    pageId: { type: Schema.Types.ObjectId, ref: "Page", index: true },
    regionId: { type: Schema.Types.ObjectId, ref: "Region", index: true },
    taskTypeId: { type: Schema.Types.ObjectId, ref: "TaskType", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: TASK_STATUSES,
      required: true,
      default: "TODO",
      index: true,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      required: true,
      default: "NORMAL",
    },
    baseRate: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    contextPageIds: [{ type: Schema.Types.ObjectId, ref: "Page" }],
  },
  { timestamps: true },
)

taskSchema.index({ seriesId: 1, assignedTo: 1, status: 1 })
taskSchema.index({ chapterId: 1, status: 1 })

taskSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    delete ret.__v
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export const Task = mongoose.model<TaskDocument>("Task", taskSchema)
