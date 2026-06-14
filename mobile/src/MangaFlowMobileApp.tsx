import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { MFBadge, MFCard, MFDetailList, MFHeader, MFIconCircle, MFScreen, MFTimeline, type TabItem } from "@/components/mf"
import { colors, radius, spacing } from "@/design/tokens"
import {
  BoardAtRiskScreen,
  BoardHomeScreen,
  BoardRankingScreen,
  BoardReviewsScreen,
  BoardTieBreakScreen,
} from "@/screens/board-screens"
import {
  EditorCommentsScreen,
  EditorHomeScreen,
  EditorManuscriptsScreen,
  EditorReadinessScreen,
} from "@/screens/editor-screens"
import type { Role } from "@/domain/workflow"

const boardTabs: TabItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "reviews", label: "Reviews", icon: "file-text" },
  { id: "votes", label: "Votes", icon: "check-circle" },
  { id: "ranking", label: "Ranking", icon: "bar-chart-2" },
  { id: "profile", label: "Profile", icon: "circle-user" },
]

const editorTabs: TabItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "review", label: "Review", icon: "file-text" },
  { id: "comments", label: "Comments", icon: "message-circle" },
  { id: "readiness", label: "Readiness", icon: "shield-check" },
  { id: "profile", label: "Profile", icon: "circle-user" },
]

export function MangaFlowMobileApp() {
  const [role, setRole] = useState<Role>("board")
  const [boardTab, setBoardTab] = useState("home")
  const [editorTab, setEditorTab] = useState("home")

  const activeTabs = role === "board" ? boardTabs : editorTabs
  const activeTab = role === "board" ? boardTab : editorTab
  const setActiveTab = role === "board" ? setBoardTab : setEditorTab

  const screen = useMemo(() => {
    if (role === "board") {
      if (boardTab === "reviews") return <BoardReviewsScreen />
      if (boardTab === "votes") return <BoardTieBreakScreen />
      if (boardTab === "ranking") return <BoardRankingScreen />
      if (boardTab === "profile") return <RoleProfile role="BOARD" name="Aiko Mori" />
      return <BoardHomeScreen />
    }

    if (editorTab === "review") return <EditorManuscriptsScreen />
    if (editorTab === "comments") return <EditorCommentsScreen />
    if (editorTab === "readiness") return <EditorReadinessScreen />
    if (editorTab === "profile") return <RoleProfile role="EDITOR" name="Rin Sato" />
    return <EditorHomeScreen />
  }, [boardTab, editorTab, role])

  return (
    <MFScreen tabs={activeTabs} activeTab={activeTab} onTabChange={setActiveTab} role={role}>
      <MFHeader
        role={role === "board" ? "BOARD" : "EDITOR"}
        logoSuffix={role === "board" ? "BOARD" : undefined}
        userName={role === "board" ? "Aiko Mori" : "Rin Sato"}
        subtitle={role === "board" ? "Board Chair" : "Editor"}
      />
      <View style={styles.roleSwitch}>
        <RoleButton active={role === "board"} label="Board" onPress={() => setRole("board")} />
        <RoleButton active={role === "editor"} label="Tantou Editor" onPress={() => setRole("editor")} />
      </View>
      <RoleHandoffSummary role={role} />
      {screen}
    </MFScreen>
  )
}

function RoleButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.roleButton, active && styles.roleButtonActive]}>
      <Text style={[styles.roleButtonText, active && styles.roleButtonTextActive]}>{label}</Text>
    </Pressable>
  )
}

function RoleProfile({ role, name }: { role: "BOARD" | "EDITOR"; name: string }) {
  const isBoard = role === "BOARD"

  return (
    <>
      <MFCard style={styles.profileHero}>
        <MFIconCircle tone={isBoard ? "warning" : "primary"} icon={isBoard ? "scale-balance" : "file-text"} size={58} />
        <View style={styles.profileHeroText}>
          <View style={styles.profileTitleBlock}>
            <Text style={styles.profileTitle}>{name}</Text>
            <MFBadge tone={isBoard ? "warning" : "primary"}>{isBoard ? "Board Chair" : "Tantou Editor"}</MFBadge>
          </View>
          <Text style={styles.profileText}>{isBoard ? "Board governance companion for votes, tie-breaks, ranking, and at-risk review." : "Editor companion for proposal review, final approval, comments, and readiness evidence."}</Text>
        </View>
      </MFCard>
      <MFDetailList items={[
        { id: "scope", label: "Mobile scope", value: isBoard ? "Board and Board Chair surfaces only. No Admin override is represented." : "Tantou Editor surfaces only. Proposal review and final approval stay visually separate.", tone: "primary", icon: isBoard ? "scale-balance" : "shield-check" },
        { id: "data", label: "Data boundary", value: "Async mock data-source now; future API wiring replaces the service boundary without changing screen ownership.", tone: "neutral", icon: "file-check" },
        { id: "security", label: "Backend-owned", value: "Auth, permissions, signed URLs, workflow transitions, readiness, ranking, and payroll remain backend-owned.", tone: "danger", icon: "lock" },
      ]} />
      <MFTimeline items={[
        { id: "current", title: isBoard ? "Review Board queues" : "Review Editor queues", subtitle: isBoard ? "Votes, tie-breaks, ranking, and at-risk cases stay auditable backend workflows later." : "Proposal, final approval, comments, and readiness are displayed with local mock state.", tone: "primary", icon: "file-text" },
        { id: "handoff", title: isBoard ? "Receive Editor-forwarded proposals" : "Forward proposal to Board", subtitle: "Mobile handoff copy explains the next surface but does not call workflow endpoints.", tone: "warning", icon: "chevron-right" },
        { id: "future", title: "Future API story", subtitle: "Replace mockMobileWorkflowDataSource with read-only API calls first, then handle mutations in high-risk stories.", tone: "success", icon: "check-circle" },
      ]} />
    </>
  )
}

function RoleHandoffSummary({ role }: { role: Role }) {
  const isBoard = role === "board"

  return (
    <MFCard style={styles.handoffCard}>
      <MFIconCircle tone={isBoard ? "warning" : "primary"} icon={isBoard ? "scale-balance" : "shield-check"} size={48} />
      <View style={styles.handoffText}>
        <Text style={styles.handoffTitle}>{isBoard ? "Board handoff from Editor review" : "Editor handoff to Board review"}</Text>
        <Text style={styles.handoffBody}>
          {isBoard
            ? "Proposals appear here only after Editor forwards them. Tie-break and at-risk actions are shown as confirmed mock UI, not final backend decisions."
            : "Proposal review, final approval, comments, and readiness stay separate so future API wiring can target the correct workflow endpoint."}
        </Text>
      </View>
    </MFCard>
  )
}

const styles = StyleSheet.create({
  roleSwitch: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.full, padding: 4, borderWidth: 1, borderColor: colors.outlineVariant },
  roleButton: { flex: 1, minHeight: 42, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  roleButtonActive: { backgroundColor: colors.primary },
  roleButtonText: { color: colors.textMuted, fontWeight: "800" },
  roleButtonTextActive: { color: colors.surface },
  handoffCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceLow, borderColor: colors.outlineVariant },
  handoffText: { flex: 1 },
  handoffTitle: { color: colors.text, fontSize: 15, fontWeight: "900" },
  handoffBody: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  profileHero: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surfaceLow },
  profileHeroText: { flex: 1 },
  profileTitleBlock: { gap: spacing.xs, alignItems: "flex-start" },
  profileTitle: { color: colors.text, fontSize: 24, fontWeight: "900", lineHeight: 29 },
  profileText: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
})

