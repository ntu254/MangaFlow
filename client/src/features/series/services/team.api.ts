import { apiClient } from "@/shared/lib/axios"
import type { ApiResponse } from "@/shared/types"

// ── Types (Flow-03) ───────────────────────────────────────────────────────────

export type SeriesMemberRole = "MANGAKA" | "ASSISTANT" | "EDITOR"
export type SeriesMemberStatus = "INVITED" | "ACTIVE" | "REMOVED" | "PAUSED"
export type SeriesMemberAccessScope = "FULL" | "TASK_ONLY"

export interface SeriesMember {
  _id: string
  seriesId: string
  userId: {
    _id: string
    name: string
    displayName?: string
    email: string
    role: string
  }
  role: SeriesMemberRole
  status: SeriesMemberStatus
  /** @deprecated Use status === "ACTIVE" instead */
  isActive: boolean
  accessScope: SeriesMemberAccessScope
  createdAt: string
  updatedAt: string
}

export interface EligibleAssistant {
  memberId: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  accessScope: SeriesMemberAccessScope
}

// ── Production Team API (Flow-03) ────────────────────────────────────────────

export const teamApi = {
  /**
   * List all members of a series production team.
   * Visible to: Mangaka (owner), Editor, Admin, members themselves.
   */
  listMembers: (seriesId: string) =>
    apiClient.get<ApiResponse<SeriesMember[]>>(`/series/${seriesId}/members`),

  /**
   * Add an Assistant (or Editor/Co-Mangaka) to the production team.
   * Requires: User must be ACTIVE. Series must be APPROVED/ONGOING/AT_RISK.
   */
  addMember: (
    seriesId: string,
    input: {
      userId: string
      role: "ASSISTANT" | "CO_MANGAKA" | "EDITOR"
      accessScope: SeriesMemberAccessScope
    },
  ) =>
    apiClient.post<ApiResponse<SeriesMember>>(`/series/${seriesId}/members`, input),

  /**
   * Update member status: ACTIVE ↔ PAUSED.
   */
  updateMember: (seriesId: string, memberId: string, status: "ACTIVE" | "PAUSED") =>
    apiClient.patch<ApiResponse<SeriesMember>>(
      `/series/${seriesId}/members/${memberId}`,
      { status },
    ),

  /**
   * Remove a member from the team.
   * Blocked if the member has active tasks.
   */
  removeMember: (seriesId: string, memberId: string) =>
    apiClient.delete<ApiResponse<SeriesMember>>(
      `/series/${seriesId}/members/${memberId}`,
    ),

  /**
   * Flow-03: Get assistants eligible for task assignment —
   * those with status ACTIVE, role ASSISTANT, and an active user account.
   */
  getEligibleAssistants: (seriesId: string) =>
    apiClient.get<ApiResponse<EligibleAssistant[]>>(
      `/series/${seriesId}/eligible-assistants`,
    ),
}
