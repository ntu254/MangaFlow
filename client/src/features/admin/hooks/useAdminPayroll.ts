import { useCallback, useEffect, useMemo, useState } from "react"
import {
  confirmAdminPayrollEarning,
  listAdminPayrollEarnings,
  markAdminPayrollEarningPaid,
  type AdminPayrollEarning,
} from "../api/admin.api"

function earningKey(earning: AdminPayrollEarning) {
  return earning.id ?? earning._id ?? earning.taskId
}

export function useAdminPayroll() {
  const [earnings, setEarnings] = useState<AdminPayrollEarning[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [updatingEarningId, setUpdatingEarningId] = useState("")

  const loadEarnings = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await listAdminPayrollEarnings()
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load payroll earnings.")
        setEarnings([])
        return
      }
      setEarnings(response.data)
    } catch {
      setError("Could not reach MangaFlow payroll API.")
      setEarnings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadEarnings() }, [loadEarnings])

  const replaceEarning = useCallback((updated: AdminPayrollEarning) => {
    const updatedKey = earningKey(updated)
    setEarnings((current) => current.map((earning) => earningKey(earning) === updatedKey || earning.taskId === updated.taskId ? updated : earning))
  }, [])

  const handleConfirm = useCallback(async (earning: AdminPayrollEarning) => {
    const confirmed = window.confirm("Confirm this pending earning for payroll tracking? This does not execute a real payment.")
    if (!confirmed) return

    setUpdatingEarningId(earningKey(earning))
    setMessage("")
    try {
      const response = await confirmAdminPayrollEarning(earning.taskId)
      if (!response.success || !response.data) {
        setMessage(response.message ?? "Could not confirm earning.")
        return
      }
      replaceEarning(response.data)
      setMessage("Earning confirmed for payroll tracking.")
    } catch {
      setMessage("Could not reach MangaFlow payroll API.")
    } finally {
      setUpdatingEarningId("")
    }
  }, [replaceEarning])

  const handleMarkPaid = useCallback(async (earning: AdminPayrollEarning) => {
    const earningId = earning.id ?? earning._id
    if (!earningId) {
      setMessage("Cannot mark earning paid because the earning id is missing.")
      return
    }

    const confirmed = window.confirm("Mark this confirmed earning as paid in tracking records? This does not execute a real payment.")
    if (!confirmed) return

    setUpdatingEarningId(earningKey(earning))
    setMessage("")
    try {
      const response = await markAdminPayrollEarningPaid(earningId)
      if (!response.success || !response.data) {
        setMessage(response.message ?? "Could not mark earning paid.")
        return
      }
      replaceEarning(response.data)
      setMessage("Earning marked paid in payroll tracking.")
    } catch {
      setMessage("Could not reach MangaFlow payroll API.")
    } finally {
      setUpdatingEarningId("")
    }
  }, [replaceEarning])

  const summary = useMemo(() => {
    return earnings.reduce(
      (totals, earning) => {
        if (earning.status === "PENDING") totals.pending += 1
        if (earning.status === "CONFIRMED") totals.confirmedAmount += earning.finalPayment
        if (earning.status === "PAID") totals.paidAmount += earning.finalPayment
        if (earning.isLate) totals.late += 1
        return totals
      },
      { pending: 0, confirmedAmount: 0, paidAmount: 0, late: 0 },
    )
  }, [earnings])

  return {
    earnings,
    loading,
    error,
    message,
    updatingEarningId,
    summary,
    loadEarnings,
    handleConfirm,
    handleMarkPaid,
  }
}

export { earningKey }
