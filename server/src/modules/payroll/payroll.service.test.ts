import { beforeEach, describe, expect, it, vi } from "vitest"
import { SeriesMember } from "../series/series.model.js"
import * as repository from "./payroll.repository.js"
import {
  calculateDeadlineMultiplier,
  calculateTaskEarningService,
  confirmTaskEarningService,
  listPayrollEarningsService,
  markEarningPaidService,
} from "./payroll.service.js"

vi.mock("./payroll.repository.js")
vi.mock("../series/series.model.js", () => ({
  SeriesMember: {
    findOne: vi.fn(),
    find: vi.fn(),
  },
}))

describe("payroll service", () => {
  const approvedTask = {
    _id: "task1",
    seriesId: "series1",
    chapterId: "chapter1",
    assignedTo: "assistant1",
    status: "EDITOR_APPROVED",
    baseRate: 100,
    dueDate: new Date("2026-06-08T10:00:00.000Z"),
    updatedAt: new Date("2026-06-08T09:00:00.000Z"),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calculates deadline multipliers from task completion time", () => {
    expect(calculateDeadlineMultiplier("EDITOR_APPROVED", approvedTask.dueDate, new Date("2026-06-07T09:00:00.000Z"))).toEqual({ multiplier: 1.1, isLate: false })
    expect(calculateDeadlineMultiplier("EDITOR_APPROVED", approvedTask.dueDate, new Date("2026-06-08T09:00:00.000Z"))).toEqual({ multiplier: 1, isLate: false })
    expect(calculateDeadlineMultiplier("EDITOR_APPROVED", approvedTask.dueDate, new Date("2026-06-09T09:00:00.000Z"))).toEqual({ multiplier: 0.95, isLate: true })
    expect(calculateDeadlineMultiplier("EDITOR_APPROVED", approvedTask.dueDate, new Date("2026-06-10T11:00:00.000Z"))).toEqual({ multiplier: 1, isLate: true })
    expect(calculateDeadlineMultiplier("REJECTED", approvedTask.dueDate, new Date("2026-06-08T09:00:00.000Z"))).toEqual({ multiplier: 0, isLate: false })
  })

  it("creates a pending earning from Task snapshot baseRate after Editor approval", async () => {
    vi.mocked(repository.getTaskForPayroll).mockResolvedValue(approvedTask as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({ isActive: true, role: "MANGAKA" } as any)
    vi.mocked(repository.getEarningByTaskId).mockResolvedValue(null)
    vi.mocked(repository.createEarningRecord).mockResolvedValue({
      id: "earning1",
      status: "PENDING",
      baseRate: 100,
      deadlineMultiplier: 1,
      finalPayment: 100,
    } as any)

    const result = await calculateTaskEarningService("task1", {
      userId: "mangaka1",
      role: "MANGAKA",
    })

    expect(result).toMatchObject({ status: "PENDING", finalPayment: 100 })
    expect(repository.createEarningRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        baseRate: 100,
        deadlineMultiplier: 1,
        finalPayment: 100,
        assistantId: "assistant1",
      }),
    )
  })

  it("calculates rejected task payment as zero", async () => {
    vi.mocked(repository.getTaskForPayroll).mockResolvedValue({
      ...approvedTask,
      status: "REJECTED",
    } as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({ isActive: true, role: "MANGAKA" } as any)
    vi.mocked(repository.getEarningByTaskId).mockResolvedValue(null)
    vi.mocked(repository.createEarningRecord).mockResolvedValue({
      id: "earning1",
      status: "PENDING",
      finalPayment: 0,
    } as any)

    await calculateTaskEarningService("task1", {
      userId: "mangaka1",
      role: "MANGAKA",
    })

    expect(repository.createEarningRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        deadlineMultiplier: 0,
        finalPayment: 0,
      }),
    )
  })

  it("blocks calculation before Editor approval or rejection", async () => {
    vi.mocked(repository.getTaskForPayroll).mockResolvedValue({
      ...approvedTask,
      status: "MANGAKA_APPROVED",
    } as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({ isActive: true, role: "MANGAKA" } as any)

    await expect(
      calculateTaskEarningService("task1", {
        userId: "mangaka1",
        role: "MANGAKA",
      }),
    ).rejects.toThrow("Payroll can be calculated only after Editor approval or rejection")
  })

  it("blocks Assistant from confirming payroll", async () => {
    vi.mocked(repository.getEarningByTaskId).mockResolvedValue({
      _id: "earning1",
      seriesId: "series1",
      status: "PENDING",
    } as any)

    await expect(
      confirmTaskEarningService("task1", {
        userId: "assistant1",
        role: "ASSISTANT",
      }),
    ).rejects.toThrow("Payroll access denied")
  })

  it("lets Mangaka confirm pending earnings", async () => {
    vi.mocked(repository.getEarningByTaskId).mockResolvedValue({
      _id: "earning1",
      seriesId: "series1",
      status: "PENDING",
    } as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({ isActive: true, role: "MANGAKA" } as any)
    vi.mocked(repository.updateEarningStatus).mockResolvedValue({
      id: "earning1",
      status: "CONFIRMED",
    } as any)

    const result = await confirmTaskEarningService("task1", {
      userId: "mangaka1",
      role: "MANGAKA",
    })

    expect(result).toMatchObject({ status: "CONFIRMED" })
  })

  it("lets only Admin mark confirmed earning paid", async () => {
    vi.mocked(repository.getEarningById).mockResolvedValue({
      _id: "earning1",
      status: "CONFIRMED",
    } as any)
    vi.mocked(repository.updateEarningStatus).mockResolvedValue({
      id: "earning1",
      status: "PAID",
    } as any)

    await expect(
      markEarningPaidService("earning1", {
        userId: "mangaka1",
        role: "MANGAKA",
      }),
    ).rejects.toThrow("Only Admin can mark earnings paid")

    const result = await markEarningPaidService("earning1", {
      userId: "admin1",
      role: "ADMIN",
    })
    expect(result).toMatchObject({ status: "PAID" })
  })

  it("lists only own earnings for Assistant", async () => {
    vi.mocked(repository.listEarnings).mockResolvedValue([{ id: "earning1" }] as any)

    await listPayrollEarningsService({
      userId: "assistant1",
      role: "ASSISTANT",
    })

    expect(repository.listEarnings).toHaveBeenCalledWith({ assistantId: "assistant1" })
  })

  it("lists all earnings for Admin tracking", async () => {
    vi.mocked(repository.listEarnings).mockResolvedValue([{ id: "earning1" }, { id: "earning2" }] as any)

    const result = await listPayrollEarningsService({
      userId: "admin1",
      role: "ADMIN",
    })

    expect(repository.listEarnings).toHaveBeenCalledWith({})
    expect(result).toHaveLength(2)
  })
})
