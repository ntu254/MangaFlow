import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { MFHeader, MFScreen, type TabItem } from "@/components/mf"
import { colors, radius, spacing } from "@/design/tokens"
import {
  BoardAtRiskScreen,
  BoardHomeScreen,
  BoardReviewsScreen,
  BoardTieBreakScreen,
} from "@/screens/board-screens"
import {
  EditorCommentsScreen,
  EditorHomeScreen,
  EditorManuscriptsScreen,
  EditorReadinessScreen,
} from "@/screens/editor-screens"
import type { Role } from "@/data/mobile-data"

const boardTabs: TabItem[] = [
  { id: "home", label: "Home", icon: "home-outline" },
  { id: "reviews", label: "Reviews", icon: "document-text-outline" },
  { id: "votes", label: "Votes", icon: "checkbox-outline" },
  { id: "ranking", label: "Ranking", icon: "bar-chart-outline" },
  { id: "profile", label: "Profile", icon: "person-circle-outline" },
]

const editorTabs: TabItem[] = [
  { id: "home", label: "Home", icon: "home-outline" },
  { id: "review", label: "Review", icon: "document-text-outline" },
  { id: "comments", label: "Comments", icon: "chatbubble-outline" },
  { id: "readiness", label: "Readiness", icon: "shield-checkmark-outline" },
  { id: "profile", label: "Profile", icon: "person-circle-outline" },
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
      if (boardTab === "ranking") return <BoardAtRiskScreen />
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
    <MFScreen tabs={activeTabs} activeTab={activeTab} onTabChange={setActiveTab}>
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
  return (
    <View style={styles.profileCard}>
      <Text style={styles.profileTitle}>{name}</Text>
      <Text style={styles.profileText}>{role === "BOARD" ? "Board Chair companion profile" : "Tantou Editor companion profile"}</Text>
      <Text style={styles.profileText}>This UI foundation uses mock data only. Backend auth and role permissions remain server-owned for a later story.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  roleSwitch: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.full, padding: 4, borderWidth: 1, borderColor: colors.outlineVariant },
  roleButton: { flex: 1, minHeight: 42, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  roleButtonActive: { backgroundColor: colors.primary },
  roleButtonText: { color: colors.textMuted, fontWeight: "800" },
  roleButtonTextActive: { color: colors.surface },
  profileCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  profileTitle: { color: colors.text, fontSize: 24, fontWeight: "900" },
  profileText: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
})

