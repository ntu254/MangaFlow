import type { PropsWithChildren, ReactNode } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, radius, shadow, spacing, typography } from "@/design/tokens"
import type { MetricItem, QueueItem, SeriesCard, Tone } from "@/data/mobile-data"

const toneColors: Record<Tone, { fg: string; bg: string }> = {
  primary: { fg: colors.primary, bg: colors.primarySoft },
  success: { fg: colors.success, bg: colors.successSoft },
  warning: { fg: colors.warning, bg: colors.warningSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
  neutral: { fg: colors.textMuted, bg: colors.surfaceContainer },
}

const coverColors: Record<SeriesCard["coverTone"], string> = {
  violet: "#43227e",
  red: "#7d1729",
  blue: "#3657a7",
  dark: "#222032",
  warm: "#c48052",
  mono: "#d9d5df",
}

export interface TabItem {
  id: string
  label: string
  icon: string
}

interface MFScreenProps extends PropsWithChildren {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tab: string) => void
}

export function MFScreen({ tabs, activeTab, onTabChange, children }: MFScreenProps) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = tab.id === activeTab
          return (
            <Pressable key={tab.id} accessibilityRole="button" onPress={() => onTabChange(tab.id)} style={styles.tabButton}>
              <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

interface MFHeaderProps {
  role: "BOARD" | "EDITOR"
  userName: string
  subtitle: string
  logoSuffix?: string
  notificationCount?: number
}

export function MFHeader({ role, userName, subtitle, logoSuffix, notificationCount = 3 }: MFHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <View style={styles.logoMark}><Text style={styles.logoMarkText}>M</Text></View>
        <View>
          <Text style={styles.logoText}>MangaFlow</Text>
          {logoSuffix ? <Text style={styles.logoSuffix}>{logoSuffix}</Text> : null}
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.bell}>
          <Text style={styles.bellText}>N</Text>
          <View style={styles.notificationBadge}><Text style={styles.notificationText}>{notificationCount}</Text></View>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{role === "BOARD" ? "A" : "R"}</Text></View>
        <View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userRole}>{subtitle}</Text>
        </View>
      </View>
    </View>
  )
}

interface HeroProps {
  title: string
  subtitle: string
  children?: ReactNode
}

export function MFHero({ title, subtitle, children }: HeroProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.inkWash} />
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>
      {children}
    </View>
  )
}

export function MFCard({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function MFBadge({ tone, children }: PropsWithChildren<{ tone: Tone }>) {
  const swatch = toneColors[tone]
  return <View style={[styles.badge, { backgroundColor: swatch.bg }]}><Text style={[styles.badgeText, { color: swatch.fg }]}>{children}</Text></View>
}

export function MFButton({ tone = "primary", children, variant = "filled" }: PropsWithChildren<{ tone?: Tone; variant?: "filled" | "outline" }>) {
  const swatch = toneColors[tone]
  return (
    <Pressable style={[styles.button, variant === "filled" ? { backgroundColor: swatch.fg, borderColor: swatch.fg } : { backgroundColor: colors.surface, borderColor: swatch.fg }]}>
      <Text style={[styles.buttonText, { color: variant === "filled" ? colors.surface : swatch.fg }]}>{children}</Text>
    </Pressable>
  )
}

export function MFMetricStrip({ items }: { items: MetricItem[] }) {
  return (
    <MFCard style={styles.metricStrip}>
      {items.map((item, index) => {
        const swatch = toneColors[item.tone]
        return (
          <View key={item.id} style={[styles.metricItem, index > 0 && styles.metricDivider]}>
            <View style={[styles.metricIcon, { backgroundColor: swatch.bg }]}><Text style={[styles.metricIconText, { color: swatch.fg }]}>{item.icon}</Text></View>
            <View>
              <Text style={styles.metricLabel}>{item.label}</Text>
              <Text style={styles.metricValue}>{item.value}</Text>
            </View>
          </View>
        )
      })}
    </MFCard>
  )
}

export function MFActionCards({ items }: { items: MetricItem[] }) {
  return (
    <View style={styles.actionGrid}>
      {items.map((item) => {
        const swatch = toneColors[item.tone]
        return (
          <MFCard key={item.id} style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: swatch.bg }]}><Text style={[styles.actionIconText, { color: swatch.fg }]}>{item.icon}</Text></View>
            <Text style={styles.actionTitle}>{item.value} {item.label}</Text>
            <Text style={[styles.actionLink, { color: swatch.fg }]}>Open now</Text>
          </MFCard>
        )
      })}
    </View>
  )
}

export function MFQueueList({ items }: { items: QueueItem[] }) {
  return (
    <MFCard>
      {items.map((item) => {
        const swatch = toneColors[item.tone]
        return (
          <View key={item.id} style={styles.queueRow}>
            <View style={[styles.queueIcon, { backgroundColor: swatch.bg }]}><Text style={[styles.queueIconText, { color: swatch.fg }]}>-</Text></View>
            <View style={styles.queueText}>
              <Text style={styles.queueTitle}>{item.title}</Text>
              <Text style={styles.queueSubtitle}>{item.subtitle}</Text>
            </View>
            {item.value ? <Text style={[styles.queueValue, { color: swatch.fg }]}>{item.value}</Text> : null}
            <Text style={styles.chevron}>{'>'}</Text>
          </View>
        )
      })}
    </MFCard>
  )
}

export function MFCover({ item, small = false }: { item: SeriesCard; small?: boolean }) {
  return (
    <View style={[styles.cover, small && styles.coverSmall, { backgroundColor: coverColors[item.coverTone] }]}>
      <View style={styles.coverGlow} />
      <Text style={styles.coverTitle}>{item.title}</Text>
    </View>
  )
}

export function MFProgress({ value }: { value: number }) {
  return <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(value * 100)}%` }]} /></View>
}

export function MFSeriesRow({ item, actionLabel = "Open summary" }: { item: SeriesCard; actionLabel?: string }) {
  return (
    <MFCard style={styles.seriesRow}>
      <MFCover item={item} />
      <View style={styles.seriesBody}>
        <View style={styles.seriesHeader}>
          <Text style={styles.seriesTitle}>{item.title}</Text>
          <MFBadge tone={item.tone}>{item.status}</MFBadge>
        </View>
        <Text style={styles.seriesSubtitle}>{item.subtitle}</Text>
        <Text style={styles.seriesMeta}>{item.meta}</Text>
        {typeof item.progressValue === "number" ? (
          <>
            <Text style={styles.seriesProgress}>{item.progress}</Text>
            <MFProgress value={item.progressValue} />
          </>
        ) : null}
        <Text style={styles.seriesAction}>{actionLabel}  {'>'}</Text>
      </View>
    </MFCard>
  )
}

export function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  )
}

export function ActivityList({ items }: { items: Array<{ id: string; title: string; time: string; tone: Tone }> }) {
  return (
    <MFCard>
      {items.map((item) => {
        const swatch = toneColors[item.tone]
        return (
          <View key={item.id} style={styles.activityRow}>
            <View style={[styles.activityDot, { borderColor: swatch.fg }]} />
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
        )
      })}
    </MFCard>
  )
}

export function SegmentedControl({ labels, activeIndex = 0 }: { labels: string[]; activeIndex?: number }) {
  return (
    <View style={styles.segmented}>
      {labels.map((label, index) => (
        <View key={label} style={[styles.segment, index === activeIndex && styles.segmentActive]}>
          <Text style={[styles.segmentText, index === activeIndex && styles.segmentTextActive]}>{label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: 110, gap: spacing.md },
  tabBar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "space-around", paddingTop: spacing.sm, paddingBottom: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  tabButton: { minWidth: 58, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 2 },
  tabIcon: { fontSize: 18, color: colors.outline },
  tabIconActive: { color: colors.primary, fontWeight: "900" },
  tabLabel: { fontSize: 11, color: colors.outline, fontWeight: "600" },
  tabLabelActive: { color: colors.primary },
  header: { minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logoMarkText: { color: colors.surface, fontSize: 22, fontWeight: "900" },
  logoText: { color: colors.primary, fontSize: 19, fontWeight: "900" },
  logoSuffix: { color: colors.primary, fontSize: 9, fontWeight: "800", letterSpacing: 4 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  bell: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.outlineVariant, alignItems: "center", justifyContent: "center" },
  bellText: { color: colors.text, fontSize: 12, fontWeight: "800" },
  notificationBadge: { position: "absolute", right: -5, top: -5, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  notificationText: { color: colors.surface, fontSize: 10, fontWeight: "800" },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.primary, fontWeight: "900" },
  userName: { color: colors.text, fontSize: 14, fontWeight: "800" },
  userRole: { color: colors.textMuted, fontSize: 12 },
  hero: { position: "relative", paddingVertical: spacing.sm, overflow: "hidden" },
  inkWash: { position: "absolute", right: -20, top: -8, width: 210, height: 96, borderRadius: 32, backgroundColor: colors.inkWash, opacity: 0.6 },
  heroTitle: { color: colors.text, fontSize: typography.display, fontWeight: "900", letterSpacing: -0.5 },
  heroSubtitle: { color: colors.textMuted, fontSize: typography.body, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: "#f0e8f4", ...shadow.card },
  metricStrip: { flexDirection: "row", paddingVertical: spacing.sm },
  metricItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  metricDivider: { borderLeftWidth: 1, borderLeftColor: colors.outlineVariant },
  metricIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  metricIconText: { fontWeight: "900", fontSize: 16 },
  metricLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  metricValue: { color: colors.text, fontSize: 21, fontWeight: "900" },
  actionGrid: { flexDirection: "row", gap: spacing.sm },
  actionCard: { flex: 1, minHeight: 132, alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.sm },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  actionIconText: { fontSize: 16, fontWeight: "900" },
  actionTitle: { color: colors.text, textAlign: "center", fontWeight: "800", fontSize: 13 },
  actionLink: { fontWeight: "800", fontSize: 12 },
  queueRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: "#f2edf5" },
  queueIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  queueIconText: { fontSize: 18, fontWeight: "900" },
  queueText: { flex: 1 },
  queueTitle: { color: colors.text, fontWeight: "800", fontSize: 14 },
  queueSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  queueValue: { fontSize: 22, fontWeight: "900" },
  chevron: { color: colors.outline, fontSize: 22 },
  cover: { width: 92, height: 118, borderRadius: radius.md, padding: spacing.sm, justifyContent: "flex-end", overflow: "hidden" },
  coverSmall: { width: 72, height: 72 },
  coverGlow: { position: "absolute", left: 12, top: 12, width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.16)" },
  coverTitle: { color: colors.surface, fontWeight: "900", fontSize: 14, textTransform: "uppercase" },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceContainer, overflow: "hidden", marginTop: spacing.sm },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  seriesRow: { flexDirection: "row", gap: spacing.md },
  seriesBody: { flex: 1, gap: 5 },
  seriesHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  seriesTitle: { color: colors.text, fontSize: 16, fontWeight: "900", flex: 1 },
  seriesSubtitle: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  seriesMeta: { color: colors.textMuted, fontSize: 11 },
  seriesProgress: { color: colors.primary, fontSize: 12, fontWeight: "800", marginTop: 4 },
  seriesAction: { color: colors.primary, fontSize: 12, fontWeight: "800", textAlign: "right", marginTop: spacing.xs },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "800" },
  button: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  buttonText: { fontWeight: "900", fontSize: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  sectionAction: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  activityRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 7 },
  activityDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  activityTitle: { flex: 1, color: colors.text, fontSize: 12 },
  activityTime: { color: colors.outline, fontSize: 11 },
  segmented: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg, padding: 4, borderWidth: 1, borderColor: colors.outlineVariant },
  segment: { flex: 1, minHeight: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: colors.primarySoft },
  segmentText: { color: colors.textMuted, fontWeight: "700", fontSize: 12 },
  segmentTextActive: { color: colors.primary, fontWeight: "900" },
})
