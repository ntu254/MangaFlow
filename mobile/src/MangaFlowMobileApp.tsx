import { useMemo, useState } from "react"
import { Image } from "expo-image"
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MFBadge, MFButton, MFCard, MFDetailList, MFHeader, MFIconCircle, MFScreen, MFTimeline, type TabItem } from "@/components/mf"
import { MFIcon } from "@/design/icons"
import { colors, radius, shadow, spacing } from "@/design/tokens"
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
import { loginMobile, logoutMobile, mobileDemoAccounts, type MobileAuthSession } from "@/services/mobile-auth"

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

const authHighlights = [
  "Board and Editor mobile scope",
  "Live API login",
  "Mock fallback stays available",
]

export function MangaFlowMobileApp() {
  const [session, setSession] = useState<MobileAuthSession | null>(null)
  const [role, setRole] = useState<Role>("board")
  const [boardTab, setBoardTab] = useState("home")
  const [editorTab, setEditorTab] = useState("home")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const activeTabs = role === "board" ? boardTabs : editorTabs
  const activeTab = role === "board" ? boardTab : editorTab
  const setActiveTab = role === "board" ? setBoardTab : setEditorTab
  const userName = session?.user.name ?? (role === "board" ? "Aiko Mori" : "Rin Sato")
  const userSubtitle = role === "board" ? "Board Chair" : "Tantou Editor"

  const handleAuthenticated = (nextSession: MobileAuthSession) => {
    setSession(nextSession)
    setRole(nextSession.role)
    setBoardTab("home")
    setEditorTab("home")
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logoutMobile(session)
    setSession(null)
    setIsLoggingOut(false)
  }

  const screen = useMemo(() => {
    if (role === "board") {
      if (boardTab === "reviews") return <BoardReviewsScreen />
      if (boardTab === "votes") return <BoardTieBreakScreen />
      if (boardTab === "ranking") return <BoardRankingScreen />
      if (boardTab === "profile") return <RoleProfile role="BOARD" name={userName} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
      return <BoardHomeScreen />
    }

    if (editorTab === "review") return <EditorManuscriptsScreen />
    if (editorTab === "comments") return <EditorCommentsScreen />
    if (editorTab === "readiness") return <EditorReadinessScreen />
    if (editorTab === "profile") return <RoleProfile role="EDITOR" name={userName} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
    return <EditorHomeScreen />
  }, [boardTab, editorTab, isLoggingOut, role, userName])

  if (!session) {
    return <MobileAuthScreen onAuthenticated={handleAuthenticated} />
  }

  return (
    <MFScreen tabs={activeTabs} activeTab={activeTab} onTabChange={setActiveTab} role={role}>
      <MFHeader
        role={role === "board" ? "BOARD" : "EDITOR"}
        logoSuffix={role === "board" ? "BOARD" : undefined}
        userName={userName}
        subtitle={userSubtitle}
      />
      <View style={styles.sessionStrip}>
        <View style={styles.sessionIdentity}>
          <MFIcon name="lock" size={15} color={colors.primary} />
          <Text style={styles.sessionText} numberOfLines={1}>{session.user.email}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={handleLogout} disabled={isLoggingOut} style={styles.logoutChip}>
          <Text style={styles.logoutText}>{isLoggingOut ? "Logging out..." : `${role === "board" ? "Board" : "Editor"} logout`}</Text>
        </Pressable>
      </View>
      <View style={styles.roleSwitch}>
        <RoleButton active={role === "board"} label="Board" onPress={() => setRole("board")} />
        <RoleButton active={role === "editor"} label="Tantou Editor" onPress={() => setRole("editor")} />
      </View>
      <RoleHandoffSummary role={role} />
      <RoleLogoutTestCard role={role} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
      {screen}
    </MFScreen>
  )
}

function MobileAuthScreen({ onAuthenticated }: { onAuthenticated: (session: MobileAuthSession) => void }) {
  const [email, setEmail] = useState(mobileDemoAccounts.board.email)
  const [password, setPassword] = useState(mobileDemoAccounts.board.password)
  const [secureEntry, setSecureEntry] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingRole, setLoadingRole] = useState<Role | "manual" | null>(null)

  const submitLogin = async (nextEmail = email, nextPassword = password, loadingKey: Role | "manual" = "manual") => {
    setError(null)
    setLoadingRole(loadingKey)
    try {
      const nextSession = await loginMobile(nextEmail.trim(), nextPassword)
      onAuthenticated(nextSession)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not sign in.")
    } finally {
      setLoadingRole(null)
    }
  }

  const useDemo = (nextRole: Role) => {
    const account = mobileDemoAccounts[nextRole]
    setEmail(account.email)
    setPassword(account.password)
    void submitLogin(account.email, account.password, nextRole)
  }

  return (
    <View style={styles.authRoot}>
      <Image source={require("../assets/images/nen.jpg")} style={styles.authBackdrop} contentFit="cover" contentPosition="right top" />
      <View style={styles.authVeil} />
      <SafeAreaView style={styles.authSafeArea}>
        <ScrollView contentContainerStyle={styles.authScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.authBrandRow}>
            <View style={styles.authLogoMark}><Text style={styles.authLogoText}>M</Text></View>
            <View>
              <Text style={styles.authBrand}>MangaFlow</Text>
              <Text style={styles.authBrandSub}>Mobile Review Console</Text>
            </View>
          </View>

          <View style={styles.authHero}>
            <Text style={styles.authKicker}>Production-first Manga OS</Text>
            <Text style={styles.authTitle}>Sign in to review manga work on the move.</Text>
            <Text style={styles.authSubtitle}>Board votes, Editor queues, comments, ranking, and at-risk review now start with the live auth API.</Text>
          </View>

          <View style={styles.authHighlightRow}>
            {authHighlights.map((item) => (
              <View key={item} style={styles.authHighlight}>
                <Text style={styles.authHighlightText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.authCard}>
            <Text style={styles.authFormTitle}>Account access</Text>
            <Text style={styles.authFormSubtitle}>Use a Board or Tantou Editor account. Mobile registration is disabled; accounts are created from the web/admin workflow.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email address</Text>
              <View style={styles.inputShell}>
                <MFIcon name="circle-user" size={18} color={colors.outline} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="you@mangaflow.local"
                  placeholderTextColor={colors.outline}
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputShell}>
                <MFIcon name="lock" size={18} color={colors.outline} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureEntry}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.outline}
                  style={styles.textInput}
                />
                <Pressable accessibilityRole="button" accessibilityLabel={secureEntry ? "Show password" : "Hide password"} onPress={() => setSecureEntry((value) => !value)} hitSlop={8}>
                  <MFIcon name={secureEntry ? "eye" : "eye-off"} size={18} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.authError}>
                <MFIcon name="alert-triangle" size={17} color={colors.danger} />
                <Text style={styles.authErrorText}>{error}</Text>
              </View>
            ) : null}

            <MFButton onPress={() => void submitLogin()} style={styles.authPrimaryButton}>
              {loadingRole === "manual" ? "Signing in..." : "Sign in"}
            </MFButton>

            <View style={styles.demoDivider}>
              <View style={styles.demoLine} />
              <Text style={styles.demoText}>API demo accounts</Text>
              <View style={styles.demoLine} />
            </View>

            <View style={styles.demoGrid}>
              <DemoAccountButton
                title={mobileDemoAccounts.board.label}
                subtitle={mobileDemoAccounts.board.roleTitle}
                tone="warning"
                loading={loadingRole === "board"}
                onPress={() => useDemo("board")}
              />
              <DemoAccountButton
                title={mobileDemoAccounts.editor.label}
                subtitle={mobileDemoAccounts.editor.roleTitle}
                tone="primary"
                loading={loadingRole === "editor"}
                onPress={() => useDemo("editor")}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function DemoAccountButton({ title, subtitle, tone, loading, onPress }: { title: string; subtitle: string; tone: "primary" | "warning"; loading: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={loading} style={styles.demoButton}>
      <MFIconCircle tone={tone} icon={tone === "warning" ? "scale-balance" : "file-text"} size={38} />
      <View style={styles.demoButtonText}>
        <Text style={styles.demoButtonTitle}>{loading ? "Signing in..." : title}</Text>
        <Text style={styles.demoButtonSubtitle}>{subtitle}</Text>
      </View>
      <MFIcon name="chevron-right" size={16} color={colors.primary} />
    </Pressable>
  )
}

function RoleLogoutTestCard({ role, onLogout, isLoggingOut }: { role: Role; onLogout: () => void; isLoggingOut: boolean }) {
  const isBoard = role === "board"
  const tone = isBoard ? "warning" : "primary"
  const label = isBoard ? "Logout Board session" : "Logout Editor session"
  const description = isBoard
    ? "Use this to verify Board login, live Board API reads, and logout cleanup in one pass."
    : "Use this to verify Editor login, live Editor API reads, and logout cleanup in one pass."

  return (
    <MFCard style={[styles.logoutTestCard, isBoard ? styles.logoutTestCardBoard : styles.logoutTestCardEditor]}>
      <MFIconCircle tone={tone} icon={isBoard ? "scale-balance" : "file-text"} size={44} />
      <View style={styles.logoutTestText}>
        <Text style={styles.logoutTestTitle}>{label}</Text>
        <Text style={styles.logoutTestBody}>{description}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onLogout} disabled={isLoggingOut} style={[styles.logoutTestButton, isBoard ? styles.logoutTestButtonBoard : styles.logoutTestButtonEditor]}>
        <Text style={styles.logoutTestButtonText}>{isLoggingOut ? "Logging out..." : "Logout"}</Text>
      </Pressable>
    </MFCard>
  )
}

function RoleButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.roleButton, active && styles.roleButtonActive]}>
      <Text style={[styles.roleButtonText, active && styles.roleButtonTextActive]}>{label}</Text>
    </Pressable>
  )
}

function RoleProfile({ role, name, onLogout, isLoggingOut }: { role: "BOARD" | "EDITOR"; name: string; onLogout: () => void; isLoggingOut: boolean }) {
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
      <MFButton tone="danger" variant="soft" onPress={onLogout}>
        {isLoggingOut ? "Logging out..." : "Logout from mobile"}
      </MFButton>
      <MFDetailList items={[
        { id: "scope", label: "Mobile scope", value: isBoard ? "Board and Board Chair surfaces only. No Admin override is represented." : "Tantou Editor surfaces only. Proposal review and final approval stay visually separate.", tone: "primary", icon: isBoard ? "scale-balance" : "shield-check" },
        { id: "data", label: "Data boundary", value: "Live API data-source now attempts read calls first, then falls back to mock data so screen ownership stays stable.", tone: "neutral", icon: "file-check" },
        { id: "security", label: "Backend-owned", value: "Auth, permissions, signed URLs, workflow transitions, readiness, ranking, and payroll remain backend-owned.", tone: "danger", icon: "lock" },
      ]} />
      <MFTimeline items={[
        { id: "current", title: isBoard ? "Review Board queues" : "Review Editor queues", subtitle: isBoard ? "Votes, tie-breaks, ranking, and at-risk cases stay auditable backend workflows later." : "Proposal, final approval, comments, and readiness are displayed with local mock state.", tone: "primary", icon: "file-text" },
        { id: "handoff", title: isBoard ? "Receive Editor-forwarded proposals" : "Forward proposal to Board", subtitle: "Mobile handoff copy explains the next surface but does not call workflow endpoints.", tone: "warning", icon: "chevron-right" },
        { id: "future", title: "Future API story", subtitle: "mobileWorkflowDataSource wraps live read calls and mockMobileWorkflowDataSource fallback; mutations stay in high-risk stories.", tone: "success", icon: "check-circle" },
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
  authRoot: { flex: 1, backgroundColor: colors.background },
  authBackdrop: { ...StyleSheet.absoluteFill, opacity: 0.28 },
  authVeil: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(248,249,250,0.88)" },
  authSafeArea: { flex: 1 },
  authScroll: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  authBrandRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  authLogoMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", ...shadow.card },
  authLogoText: { color: colors.surface, fontSize: 23, fontWeight: "900" },
  authBrand: { color: colors.primary, fontSize: 20, fontWeight: "900" },
  authBrandSub: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  authHero: { paddingTop: spacing.md, gap: spacing.sm },
  authKicker: { color: colors.primary, fontSize: 12, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase" },
  authTitle: { color: colors.text, fontSize: 34, lineHeight: 39, fontWeight: "900", letterSpacing: 0 },
  authSubtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 23, maxWidth: 420 },
  authHighlightRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  authHighlight: { borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outlineVariant, paddingHorizontal: spacing.sm, paddingVertical: 7 },
  authHighlightText: { color: colors.text, fontSize: 11, fontWeight: "800" },
  authCard: { gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.md, ...shadow.card },
  authFormTitle: { color: colors.text, fontSize: 22, fontWeight: "900" },
  authFormSubtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  inputGroup: { gap: spacing.xs },
  inputLabel: { color: colors.text, fontSize: 12, fontWeight: "900" },
  inputShell: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.lg, backgroundColor: colors.surfaceLow, paddingHorizontal: spacing.md },
  textInput: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "700", paddingVertical: 0 },
  authError: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.dangerSoft, padding: spacing.sm },
  authErrorText: { flex: 1, color: colors.danger, fontSize: 12, lineHeight: 18, fontWeight: "800" },
  authPrimaryButton: { borderRadius: radius.lg },
  demoDivider: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  demoLine: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
  demoText: { color: colors.outline, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  demoGrid: { gap: spacing.sm },
  demoButton: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.lg, backgroundColor: colors.surfaceLow, padding: spacing.sm },
  demoButtonText: { flex: 1 },
  demoButtonTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
  demoButtonSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  sessionStrip: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.outlineVariant, padding: 5 },
  sessionIdentity: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingLeft: spacing.sm },
  sessionText: { flex: 1, color: colors.textMuted, fontSize: 12, fontWeight: "800" },
  logoutChip: { minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: radius.full, backgroundColor: colors.dangerSoft, paddingHorizontal: spacing.sm },
  logoutText: { color: colors.danger, fontSize: 12, fontWeight: "900" },
  logoutTestCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1 },
  logoutTestCardBoard: { backgroundColor: colors.warningSoft, borderColor: "#f4cf8a" },
  logoutTestCardEditor: { backgroundColor: colors.primarySoft, borderColor: "#d7ccff" },
  logoutTestText: { flex: 1, minWidth: 0 },
  logoutTestTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
  logoutTestBody: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  logoutTestButton: { minHeight: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  logoutTestButtonBoard: { backgroundColor: colors.warning },
  logoutTestButtonEditor: { backgroundColor: colors.primary },
  logoutTestButtonText: { color: colors.surface, fontSize: 12, fontWeight: "900" },
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
