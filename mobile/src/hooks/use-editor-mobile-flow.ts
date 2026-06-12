import { useEffect, useMemo, useState } from "react"
import { editorHome, editorReadinessResult, finalApprovals, manuscripts, productionComments } from "@/data/editor"
import type { EditorFinalApprovalAction, EditorProposalAction } from "@/domain/workflow"
import { mockMobileWorkflowDataSource, type EditorCommentsPayload, type EditorHomePayload, type MobileWorkflowDataSource } from "@/services/mobile-workflow-data-source"

export function useEditorMobileFlow(dataSource: MobileWorkflowDataSource = mockMobileWorkflowDataSource) {
  const [home, setHome] = useState<EditorHomePayload>(editorHome)
  const [manuscriptItems, setManuscriptItems] = useState(manuscripts)
  const [submissionItems, setSubmissionItems] = useState(finalApprovals)
  const [commentsPayload, setCommentsPayload] = useState<EditorCommentsPayload>({ metrics: [], comments: productionComments, activity: [] })
  const [readiness, setReadiness] = useState(editorReadinessResult)
  const [selectedManuscriptId, setSelectedManuscriptId] = useState(manuscripts[0]?.id ?? "")
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(finalApprovals[0]?.id ?? "")
  const [lastMockAction, setLastMockAction] = useState("Mock actions are local only. Backend permissions and workflow transitions stay server-owned.")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [nextHome, nextManuscripts, nextSubmissions, nextComments, nextReadiness] = await Promise.all([
          dataSource.getEditorHome(),
          dataSource.getEditorManuscripts(),
          dataSource.getEditorSubmissions(),
          dataSource.getEditorComments(),
          dataSource.getEditorReadiness(),
        ])

        if (!cancelled) {
          setHome(nextHome)
          setManuscriptItems(nextManuscripts)
          setSubmissionItems(nextSubmissions)
          setCommentsPayload(nextComments)
          setReadiness(nextReadiness)
        }
      } catch {
        if (!cancelled) setError("Could not load editor mobile mock flow.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [dataSource])

  const selectedManuscript = useMemo(
    () => manuscriptItems.find((item) => item.id === selectedManuscriptId) ?? manuscriptItems[0],
    [manuscriptItems, selectedManuscriptId],
  )

  const selectedSubmission = useMemo(
    () => submissionItems.find((item) => item.id === selectedSubmissionId) ?? submissionItems[0],
    [submissionItems, selectedSubmissionId],
  )

  function recordProposalAction(action: EditorProposalAction) {
    setLastMockAction(`Mock ${action} recorded for proposal review. API wiring will call the matching manuscript action endpoint later.`)
  }

  function recordFinalApprovalAction(action: EditorFinalApprovalAction) {
    setLastMockAction(`Mock ${action} recorded for Editor final approval. Payroll and permissions remain backend-owned.`)
  }

  return {
    home,
    manuscriptItems,
    submissionItems,
    commentsPayload,
    readiness,
    selectedManuscript,
    selectedSubmission,
    selectedManuscriptId,
    selectedSubmissionId,
    setSelectedManuscriptId,
    setSelectedSubmissionId,
    lastMockAction,
    recordProposalAction,
    recordFinalApprovalAction,
    loading,
    error,
  }
}
