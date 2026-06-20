import { useCallback, useEffect, useMemo, useState } from "react"
import { editorHome, editorReadinessResult, finalApprovals, manuscripts, productionComments } from "@/data/editor"
import type { EditorFinalApprovalAction, EditorProposalAction, SeriesProposalSummary } from "@/domain/workflow"
import { mobileWorkflowDataSource, type EditorCommentsPayload, type EditorHomePayload, type MobileWorkflowDataSource } from "@/services/mobile-workflow-data-source"

export function useEditorMobileFlow(dataSource: MobileWorkflowDataSource = mobileWorkflowDataSource) {
  const [home, setHome] = useState<EditorHomePayload>(editorHome)
  const [manuscriptItems, setManuscriptItems] = useState(manuscripts)
  const [submissionItems, setSubmissionItems] = useState(finalApprovals)
  const [commentsPayload, setCommentsPayload] = useState<EditorCommentsPayload>({ metrics: [], comments: productionComments, activity: [] })
  const [readiness, setReadiness] = useState(editorReadinessResult)
  const [selectedProposalSummary, setSelectedProposalSummary] = useState<SeriesProposalSummary | null>(null)
  const [proposalSummaryLoading, setProposalSummaryLoading] = useState(false)
  const [selectedManuscriptId, setSelectedManuscriptId] = useState(manuscripts[0]?.id ?? "")
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(finalApprovals[0]?.id ?? "")
  const [selectedCommentId, setSelectedCommentId] = useState(productionComments[0]?.id ?? "")
  const [pendingProposalAction, setPendingProposalAction] = useState<EditorProposalAction | null>(null)
  const [pendingFinalApprovalAction, setPendingFinalApprovalAction] = useState<EditorFinalApprovalAction | null>(null)
  const [lastMockAction, setLastMockAction] = useState("Mock actions are local only. Backend permissions and workflow transitions stay server-owned.")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [proposalNote, setProposalNote] = useState("")
  const [proposalPublicationType, setProposalPublicationType] = useState<"WEEKLY" | "MONTHLY">("MONTHLY")
  const [finalApprovalNote, setFinalApprovalNote] = useState("")

  const reload = useCallback(async () => {
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
      setHome(nextHome)
      setManuscriptItems(nextManuscripts)
      setSubmissionItems(nextSubmissions)
      setCommentsPayload(nextComments)
      setReadiness(nextReadiness)
    } catch {
      setError("Could not load editor mobile flow.")
    } finally {
      setLoading(false)
    }
  }, [dataSource])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!cancelled) await reload()
    })()
    return () => {
      cancelled = true
    }
  }, [reload])

  const selectedManuscript = useMemo(
    () => manuscriptItems.find((item) => item.id === selectedManuscriptId) ?? manuscriptItems[0],
    [manuscriptItems, selectedManuscriptId],
  )

  useEffect(() => {
    const seriesId = selectedManuscript?.id
    if (!seriesId) {
      setSelectedProposalSummary(null)
      return
    }

    let cancelled = false
    setProposalSummaryLoading(true)
    void dataSource.getSeriesProposalSummary(seriesId, "editor")
      .then((summary) => {
        if (!cancelled) setSelectedProposalSummary(summary)
      })
      .catch(() => {
        if (!cancelled) setSelectedProposalSummary(null)
      })
      .finally(() => {
        if (!cancelled) setProposalSummaryLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [dataSource, selectedManuscript?.id])

  const selectedSubmission = useMemo(
    () => submissionItems.find((item) => item.id === selectedSubmissionId) ?? submissionItems[0],
    [submissionItems, selectedSubmissionId],
  )

  const selectedComment = useMemo(
    () => commentsPayload.comments.find((item) => item.id === selectedCommentId) ?? commentsPayload.comments[0],
    [commentsPayload.comments, selectedCommentId],
  )

  function startProposalAction(action: EditorProposalAction) {
    setActionError(null)
    setProposalNote("")
    setProposalPublicationType(selectedProposalSummary?.requestedPublicationType ?? selectedManuscript?.requestedPublicationType ?? "MONTHLY")
    setPendingProposalAction(action)
  }

  function cancelProposalAction() {
    if (actionBusy) return
    setPendingProposalAction(null)
    setActionError(null)
    setProposalNote("")
  }

  async function confirmProposalAction() {
    const action = pendingProposalAction
    const target = selectedManuscript
    if (!action || !target) return

    const note = proposalNote.trim()
    if (action !== "forward-to-board" && !note) {
      setActionError("Please enter a note for the mangaka before continuing.")
      return
    }

    setActionBusy(true)
    setActionError(null)
    try {
      if (action === "start-review") {
        await dataSource.startEditorProposalReview(target.id)
      } else if (action === "request-revision") {
        await dataSource.requestEditorProposalRevision(target.id, { revisionReason: note, feedbackSummary: note })
      } else if (action === "reject") {
        await dataSource.rejectEditorProposal(target.id, { rejectReason: note })
      } else {
        await dataSource.forwardEditorProposalToBoard(target.id, {
          editorRecommendation: note || target.editorRecommendation || "Forwarded for Board review.",
          feasibilityNote: note || "Production scope reviewed by editor.",
          suggestedPublicationType: proposalPublicationType,
        })
      }
      setLastMockAction(`Proposal ${action} sent for ${target.title}.`)
      setPendingProposalAction(null)
      setProposalNote("")
      await reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not complete the action.")
    } finally {
      setActionBusy(false)
    }
  }

  function startFinalApprovalAction(action: EditorFinalApprovalAction) {
    setActionError(null)
    setFinalApprovalNote("")
    setPendingFinalApprovalAction(action)
  }

  function cancelFinalApprovalAction() {
    if (actionBusy) return
    setPendingFinalApprovalAction(null)
    setActionError(null)
    setFinalApprovalNote("")
  }

  async function confirmFinalApprovalAction() {
    const action = pendingFinalApprovalAction
    const target = selectedSubmission
    if (!action || !target) return

    const note = finalApprovalNote.trim()
    if ((action === "request-revision" || action === "add-comment") && !note) {
      setActionError(action === "add-comment" ? "Please enter the comment body before submitting." : "Please enter a reviewer note before requesting revision.")
      return
    }
    if (action === "add-comment" && (!target.seriesId || !target.taskId)) {
      setActionError("This submission is missing series/task context for the comment API.")
      return
    }

    setActionBusy(true)
    setActionError(null)
    try {
      if (action === "request-revision") {
        await dataSource.requestEditorSubmissionRevision(target.id, note)
      } else if (action === "add-comment") {
        await dataSource.createEditorComment({
          seriesId: target.seriesId as string,
          chapterId: target.chapterId,
          pageId: target.pageId,
          taskId: target.taskId,
          submissionId: target.id,
          body: note,
          isBlocking: true,
        })
      } else {
        await dataSource.editorApproveSubmission(target.id, note || "Approved for production.")
      }
      setLastMockAction(`Submission ${action} sent for ${target.title}.`)
      setPendingFinalApprovalAction(null)
      setFinalApprovalNote("")
      await reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not complete the action.")
    } finally {
      setActionBusy(false)
    }
  }

  async function resolveSelectedComment() {
    const target = selectedComment
    if (!target) return

    setActionBusy(true)
    setActionError(null)
    try {
      await dataSource.resolveEditorComment(target.id)
      setLastMockAction(`Comment resolved through live API for ${target.title}.`)
      await reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not resolve the selected comment.")
    } finally {
      setActionBusy(false)
    }
  }

  async function reopenSelectedComment() {
    const target = selectedComment
    if (!target) return

    setActionBusy(true)
    setActionError(null)
    try {
      await dataSource.reopenEditorComment(target.id)
      setLastMockAction(`Comment reopened through live API for ${target.title}.`)
      await reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not reopen the selected comment.")
    } finally {
      setActionBusy(false)
    }
  }

  return {
    home,
    manuscriptItems,
    submissionItems,
    commentsPayload,
    readiness,
    selectedManuscript,
    selectedSubmission,
    selectedComment,
    selectedProposalSummary,
    proposalSummaryLoading,
    selectedManuscriptId,
    selectedSubmissionId,
    selectedCommentId,
    pendingProposalAction,
    pendingFinalApprovalAction,
    setSelectedManuscriptId,
    setSelectedSubmissionId,
    setSelectedCommentId,
    lastMockAction,
    startProposalAction,
    confirmProposalAction,
    cancelProposalAction,
    startFinalApprovalAction,
    confirmFinalApprovalAction,
    cancelFinalApprovalAction,
    resolveSelectedComment,
    reopenSelectedComment,
    proposalNote,
    setProposalNote,
    proposalPublicationType,
    setProposalPublicationType,
    finalApprovalNote,
    setFinalApprovalNote,
    actionBusy,
    actionError,
    reload,
    loading,
    error,
  }
}
