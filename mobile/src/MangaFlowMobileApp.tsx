import { useMemo, useState } from "react"
import { Image } from "expo-image"
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MFButton, MFHeader, MFIconCircle, MFScreen, type TabItem } from "@/components/mf"
import { MFIcon } from "@/design/icons"
import { colors, radius, shadow, spacing } from "@/design/tokens"
import { MobileQueryProvider } from "@/providers/mobile-query-provider"
import { useMobileInbox } from "@/hooks/use-mobile-inbox"
import { EditorTodayScreen } from "@/screens/editor-today-screen"
import { BoardTodayScreen } from "@/screens/board-today-screen"
import { WorkflowState } from "@/components/workflow-state"
import { mobileEnv } from "@/config/mobile-env"
import type { MobileInbox } from "@/domain/mobile-work-item"
import {
  loginMobile,
  logoutMobile,
  mobileDemoAccounts,
  type MobileAuthRole,
  type MobileAuthSession,
} from "@/services/mobile-auth"

// Canonical Queue-first tabs. Later plans complete Reviews/Publish/History
// (Editor) and Sessions/Ranking/History (Board); Today is live in this slice.
const editorTabs: TabItem[] = [
  { id: "today", label: "Today", icon: "home" },
  { id: "reviews", label: "Reviews", icon: "file-text" },
  { id: "publish", label: "Publish", icon: "check-circle" },
  { id: "history", label: "History", icon: "shield-check" },
]

const boardTabs: TabItem[] = [
  { id: "today", label: "Today", icon: "home" },
  { id: "sessions", label: "Sessions", icon: "file-text" },
  { id: "ranking", label: "Ranking", icon: "bar-chart-2" },
  { id: "history", label: "History", icon: "shield-check" },
]

function designationFor(session: MobileAuthSession): string {
  if (session.role === "board") return session.user.isChair ? "Board Chair" : "Board Member"
  return session.user.isEditorInChief ? "Editor-in-Chief" : "Tantou Editor"
}

// Small demo inbox so mock mode shows a labeled reference surface instead of
// hitting the live API. Only used when demo mode is explicitly enabled.
function demoInbox(role: MobileAuthRole): MobileInbox {
  return {
    role: role === "board" ? "BOARD" : "EDITOR",
    generatedAt: new Date().toISOString(),
    items: [],
  }
}

export function MangaFlowMobileApp({
  initialSession = null,
  forceDemoMode = false,
}: {
  initialSession?: MobileAuthSession | null
  forceDemoMode?: boolean
}) {
  const [session, setSession] = useState<MobileAuthSession | null>(initialSession)
  const [tab, setTab] = useState("today")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const demoMode = forceDemoMode || mobileEnv.enableMockFallback

  const handleAuthenticated = (next: MobileAuthSession) => {
    setSession(next)
    setTab("today")
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logoutMobile(session)
    setSession(null)
    setMenuOpen(false)
    setIsLoggingOut(false)
  }

  if (!session) {
    return <MobileAuthScreen onAuthenticated={handleAuthenticated} />
  }

  return (
    <MobileQueryProvider>
      <AuthenticatedShell
        session={session}
        tab={tab}
        onTabChange={setTab}
        demoMode={demoMode}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    </MobileQueryProvider>
  )
}

function AuthenticatedShell({
  session,
  tab,
  onTabChange,
  demoMode,
  menuOpen,
  onToggleMenu,
  onLogout,
  isLoggingOut,
}: {
  session: MobileAuthSession
  tab: string
  onTabChange: (tab: string) => void
  demoMode: boolean
  menuOpen: boolean
  onToggleMenu: () => void
  onLogout: () => void
  isLoggingOut: boolean
}) {
  const role = session.role
  const tabs = role === "board" ? boardTabs : editorTabs
  const designation = designationFor(session)

  const inbox = useMobileInbox(role)

  const body = useMemo(() => {
    if (tab !== "today") {
      return (
        <WorkflowState
          kind="empty"
          title="Coming soon"
          description="This workflow arrives in the next mobile slice."
        />
      )
    }
    const props = {
      inbox: demoMode ? demoInbox(role) : inbox.data,
      isLoading: inbox.isLoading,
      error: inbox.error as Error | null,
      onRetry: () => void inbox.refetch(),
      onRefresh: () => void inbox.refetch(),
      refreshing: inbox.isRefetching,
      // The shell owns the persistent Demo data label, so the queue omits its own.
    }
    return role === "board" ? <BoardTodayScreen {...props} /> : <EditorTodayScreen {...props} />
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, inbox.data, inbox.error, inbox.isLoading, inbox.isRefetching, role, tab])

  return (
    <MFScreen tabs={tabs} activeTab={tab} onTabChange={onTabChange} role={role}>
      <MFHeader
        role={role === "board" ? "BOARD" : "EDITOR"}
        logoSuffix={role === "board" ? "BOARD" : undefined}
        userName={session.user.name}
        subtitle={designation}
      />
      <View style={styles.sessionStrip}>
        <View style={styles.sessionIdentity}>
          {demoMode ? (
            <View style={styles.demoChip}>
              <Text style={styles.demoChipText}>Demo data</Text>
            </View>
          ) : (
            <MFIcon name="lock" size={15} color={colors.primary} />
          )}
          <Text style={styles.sessionText} numberOfLines={1}>
            {session.user.email}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account menu"
          onPress={onToggleMenu}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{session.user.name.slice(0, 1).toUpperCase()}</Text>
        </Pressable>
      </View>
      {menuOpen ? (
        <View style={styles.menu}>
          <Text style={styles.menuName}>{session.user.name}</Text>
          <Text style={styles.menuDesignation}>{designation}</Text>
          <MFButton tone="danger" variant="soft" onPress={onLogout}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </MFButton>
        </View>
      ) : null}
      {body}
    </MFScreen>
  )
}

function MobileAuthScreen({ onAuthenticated }: { onAuthenticated: (session: MobileAuthSession) => void }) {
  const [email, setEmail] = useState(mobileDemoAccounts.board.email)
  const [password, setPassword] = useState(mobileDemoAccounts.board.password)
  const [secureEntry, setSecureEntry] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingKey, setLoadingKey] = useState<MobileAuthRole | "manual" | null>(null)

  const submitLogin = async (
    nextEmail = email,
    nextPassword = password,
    key: MobileAuthRole | "manual" = "manual",
  ) => {
    setError(null)
    setLoadingKey(key)
    try {
      const nextSession = await loginMobile(nextEmail.trim(), nextPassword)
      onAuthenticated(nextSession)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not sign in.")
    } finally {
      setLoadingKey(null)
    }
  }

  const useDemo = (nextRole: MobileAuthRole) => {
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
            <Text style={styles.authSubtitle}>Board and Tantou Editor identities come from the live auth API. There is no manual role switch.</Text>
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
              {loadingKey === "manual" ? "Signing in..." : "Sign in"}
            </MFButton>

            <View style={styles.demoDivider}>
              <View style={styles.demoLine} />
              <Text style={styles.demoText}>API demo accounts</Text>
              <View style={styles.demoLine} />
            </View>

            <View style={styles.demoGrid}>
              <DemoAccountButton
                title={mobileDemoAccounts.board.roleTitle}
                subtitle={mobileDemoAccounts.board.email}
                tone="warning"
                loading={loadingKey === "board"}
                onPress={() => useDemo("board")}
              />
              <DemoAccountButton
                title={mobileDemoAccounts.editor.roleTitle}
                subtitle={mobileDemoAccounts.editor.email}
                tone="primary"
                loading={loadingKey === "editor"}
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
  demoChip: { backgroundColor: colors.warningSoft, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  demoChipText: { color: colors.warning, fontSize: 11, fontWeight: "900" },
  avatar: { width: 34, height: 34, borderRadius: radius.full, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.primary, fontSize: 15, fontWeight: "900" },
  menu: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.md, gap: spacing.xs, ...shadow.card },
  menuName: { color: colors.text, fontSize: 15, fontWeight: "900" },
  menuDesignation: { color: colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: spacing.xs },
})
