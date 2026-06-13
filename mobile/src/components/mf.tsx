import type { PropsWithChildren, ReactNode } from "react"
import { Image } from "expo-image"
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MFHeaderBackground } from "@/components/header-background"
import { colors, radius, shadow, spacing, typography } from "@/design/tokens"
import { MFIcon, type IconName } from "@/design/icons"
import type { MetricItem, QueueItem, Role, SeriesCard, Tone } from "@/data/mobile-data"

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

const shadowlineCover = require("../../assets/images/biatruyen.jpg")
const crimsonRoadCover = require("../../assets/images/biatruyen1.jpg")

const defaultQueueIcons: Record<Tone, IconName> = {
  primary: "file-text",
  success: "check-circle",
  warning: "alert-circle",
  danger: "alert-triangle",
  neutral: "circle",
}

const defaultActivityIcons: Record<Tone, IconName> = {
  primary: "file-text",
  success: "check-circle",
  warning: "alert-circle",
  danger: "alert-triangle",
  neutral: "circle",
}

export interface TabItem {
  id: string
  label: string
  icon: IconName
}

interface MFScreenProps extends PropsWithChildren {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tab: string) => void
  role?: Role
}

export function MFScreen({ tabs, activeTab, onTabChange, children, role = "editor" }: MFScreenProps) {
  return (
    <View style={styles.root}>
      <MFHeaderBackground role={role} />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = tab.id === activeTab
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              hitSlop={8}
              onPress={() => onTabChange(tab.id)}
              style={styles.tabButton}
            >
              <MFIcon name={tab.icon} size={22} color={active ? colors.primary : colors.outline} />
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
          <MFIcon name="bell" size={18} color={colors.text} />
          <View style={styles.notificationBadge}><Text style={styles.notificationText}>{notificationCount}</Text></View>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{role === "BOARD" ? "A" : "R"}</Text></View>
        <View style={styles.userBlock}>
          <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
          <Text style={styles.userRole} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>
    </View>
  )
}

interface HeroProps {
  title: string
  subtitle: string
  children?: ReactNode
  role?: Role
}

export function MFHero({ title, subtitle, children }: HeroProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
      </View>
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

export function MFIconCircle({ tone, icon, size = 42 }: { tone: Tone; icon: IconName; size?: number }) {
  const swatch = toneColors[tone]
  return (
    <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: swatch.bg }]}>
      <MFIcon name={icon} size={Math.max(18, Math.round(size * 0.48))} color={swatch.fg} />
    </View>
  )
}

export function MFButton({
  tone = "primary",
  children,
  variant = "filled",
  onPress,
  accessibilityLabel,
}: PropsWithChildren<{ tone?: Tone; variant?: "filled" | "outline"; onPress?: () => void; accessibilityLabel?: string }>) {
  const swatch = toneColors[tone]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.button, variant === "filled" ? { backgroundColor: swatch.fg, borderColor: swatch.fg } : { backgroundColor: colors.surface, borderColor: swatch.fg }]}
    >
      <Text style={[styles.buttonText, { color: variant === "filled" ? colors.surface : swatch.fg }]}>{children}</Text>
    </Pressable>
  )
}

export function MFConfirmationPanel({
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  endpointHint,
  onConfirm,
  onCancel,
}: {
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  tone?: Tone
  endpointHint?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const swatch = toneColors[tone]

  return (
    <MFCard style={[styles.confirmationPanel, { borderColor: swatch.fg }]}>
      <View style={styles.confirmationHeader}>
        <MFIconCircle tone={tone} icon={tone === "danger" ? "alert-triangle" : tone === "success" ? "check-circle" : "file-check"} />
        <View style={styles.confirmationTitleBlock}>
          <Text style={styles.confirmationKicker}>Confirmation required</Text>
          <Text style={styles.confirmationTitle}>{title}</Text>
        </View>
      </View>
      <Text style={styles.confirmationBody}>{body}</Text>
      {endpointHint ? <Text style={styles.confirmationHint}>{endpointHint}</Text> : null}
      <View style={styles.confirmationActions}>
        <MFButton tone={tone} onPress={onConfirm}>{confirmLabel}</MFButton>
        <MFButton tone="neutral" variant="outline" onPress={onCancel}>{cancelLabel}</MFButton>
      </View>
    </MFCard>
  )
}

export function MFMetricStrip({ items }: { items: MetricItem[] }) {
  const compact = items.length > 3

  return (
    <MFCard style={styles.metricStrip}>
      {items.map((item, index) => {
        return (
          <View key={item.id} style={[styles.metricItem, compact && styles.metricItemCompact, index > 0 && styles.metricDivider]}>
            <MFIconCircle tone={item.tone} icon={item.icon} size={compact ? 38 : 42} />
            <View style={compact && styles.metricTextCompact}>
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text style={[styles.metricLabel, compact && styles.metricLabelCompact]}>{item.label}</Text>
            </View>
          </View>
        )
      })}
    </MFCard>
  )
}

export function MFActionCards({ items }: { items: MetricItem[] }) {
  const { width } = useWindowDimensions()
  const compactCards = width <= 460

  return (
    <View style={[styles.actionGrid, compactCards && styles.actionGridCompact]}>
      {items.map((item) => {
        const swatch = toneColors[item.tone]
        return (
          <MFCard key={item.id} style={[styles.actionCard, compactCards ? styles.actionCardCompact : styles.actionCardWide]}>
            <MFIconCircle tone={item.tone} icon={item.icon} size={44} />
            <Text style={styles.actionTitle} numberOfLines={2}>{item.value} {item.label}</Text>
            {item.subtitle ? <Text style={styles.actionSubtitle} numberOfLines={2}>{item.subtitle}</Text> : null}
            <View style={styles.actionLinkRow}>
              <Text style={[styles.actionLink, { color: swatch.fg }]} numberOfLines={1}>{item.actionLabel ?? "Open now"}</Text>
              <MFIcon name="chevron-right" size={14} color={swatch.fg} />
            </View>
          </MFCard>
        )
      })}
    </View>
  )
}

export function MFQueueList({ items }: { items: QueueItem[] }) {
  return (
    <MFCard>
      {items.map((item, index) => {
        const swatch = toneColors[item.tone]
        return (
          <View key={item.id} style={[styles.queueRow, index === items.length - 1 && styles.queueRowLast]}>
            <View style={[styles.queueIcon, { backgroundColor: swatch.bg }]}>
              <MFIcon name={item.icon ?? defaultQueueIcons[item.tone]} size={20} color={swatch.fg} />
            </View>
            <View style={styles.queueText}>
              <Text style={styles.queueTitle}>{item.title}</Text>
              <Text style={styles.queueSubtitle}>{item.subtitle}</Text>
            </View>
            {item.value ? <Text style={[styles.queueValue, { color: swatch.fg }]}>{item.value}</Text> : null}
            <MFIcon name="chevron-right" size={18} color={colors.outline} />
          </View>
        )
      })}
    </MFCard>
  )
}

export function MFCover({ item, small = false }: { item: SeriesCard; small?: boolean }) {
  const coverSource = getCoverSource(item)

  return (
    <View style={[styles.cover, small && styles.coverSmall, { backgroundColor: coverColors[item.coverTone] }]}>
      {coverSource ? (
        <Image source={coverSource} style={styles.coverImage} contentFit="cover" transition={0} />
      ) : (
        <View style={styles.coverGlow} />
      )}
      <View style={styles.coverShade} />
      <Text style={[styles.coverTitle, coverSource && styles.coverTitleOverlay]} numberOfLines={2}>{item.title}</Text>
    </View>
  )
}

function getCoverSource(item: SeriesCard) {
  const title = item.title.toLowerCase()

  if (title.includes("crimson") || item.coverTone === "red" || item.coverTone === "warm") return crimsonRoadCover
  return shadowlineCover
}

export function MFProgress({ value }: { value: number }) {
  return <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(value * 100)}%` }]} /></View>
}

export function MFSeriesRow({
  item,
  actionLabel = "Open summary",
  selected = false,
  onPress,
}: {
  item: SeriesCard
  actionLabel?: string
  selected?: boolean
  onPress?: () => void
}) {
  const tags = item.tags ?? item.subtitle.split("/").map((tag) => tag.trim()).filter(Boolean)
  const content = (
    <>
      <MFCover item={item} />
      <View style={styles.seriesBody}>
        <View style={styles.seriesHeader}>
          <Text style={styles.seriesTitle}>{item.title}</Text>
          <MFBadge tone={item.tone}>{item.status}</MFBadge>
        </View>
        <View style={styles.seriesTags}>
          {tags.map((tag) => <Text key={tag} style={styles.seriesTag}>{tag}</Text>)}
        </View>
        <Text style={styles.seriesMeta}>{item.meta}</Text>
        {typeof item.progressValue === "number" ? (
          <>
            <Text style={styles.seriesProgress}>{item.progress}</Text>
            <MFProgress value={item.progressValue} />
          </>
        ) : null}
        <View style={[styles.seriesActionPill, selected && styles.seriesActionPillSelected]}>
          <Text style={[styles.seriesAction, selected && styles.seriesActionSelected]}>{selected ? "Selected" : actionLabel}</Text>
          <MFIcon name={selected ? "check" : "chevron-right"} size={14} color={selected ? colors.surface : colors.primary} />
        </View>
      </View>
    </>
  )

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.seriesRow, selected && styles.seriesRowSelected]}>
        {content}
      </Pressable>
    )
  }

  return (
    <MFCard style={[styles.seriesRow, selected && styles.seriesRowSelected]}>
      {content}
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

export function ActivityList({ items }: { items: Array<{ id: string; title: string; time: string; tone: Tone; icon?: IconName }> }) {
  return (
    <MFCard>
      {items.map((item) => {
        const swatch = toneColors[item.tone]
        return (
          <View key={item.id} style={styles.activityRow}>
            <View style={[styles.activityIcon, { backgroundColor: swatch.bg }]}>
              <MFIcon name={item.icon ?? defaultActivityIcons[item.tone]} size={15} color={swatch.fg} strokeWidth={2.4} />
            </View>
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
  safeArea: { flex: 1, zIndex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: 110, gap: spacing.md },
  tabBar: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10, elevation: 10, flexDirection: "row", justifyContent: "space-around", paddingTop: spacing.sm, paddingBottom: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  tabButton: { minWidth: 58, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 2 },
  tabLabel: { fontSize: 11, color: colors.outline, fontWeight: "600" },
  tabLabelActive: { color: colors.primary },
  header: { minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 0 },
  logoMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logoMarkText: { color: colors.surface, fontSize: 22, fontWeight: "900" },
  logoText: { color: colors.primary, fontSize: 19, fontWeight: "900" },
  logoSuffix: { color: colors.primary, fontSize: 9, fontWeight: "800", letterSpacing: 4 },
  headerRight: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: spacing.sm, minWidth: 0 },
  bell: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.outlineVariant, alignItems: "center", justifyContent: "center" },
  notificationBadge: { position: "absolute", right: -5, top: -5, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  notificationText: { color: colors.surface, fontSize: 10, fontWeight: "800" },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.primary, fontWeight: "900" },
  userBlock: { flexShrink: 1, minWidth: 64, maxWidth: 96 },
  userName: { color: colors.text, fontSize: 14, fontWeight: "800", textAlign: "left" },
  userRole: { color: colors.textMuted, fontSize: 12, textAlign: "left" },
  iconCircle: { alignItems: "center", justifyContent: "center" },
  hero: { position: "relative", paddingVertical: spacing.sm, minHeight: 112 },
  heroContent: { position: "relative", zIndex: 1 },
  heroTitle: { color: colors.text, fontSize: typography.display, fontWeight: "900", letterSpacing: 0 },
  heroSubtitle: { color: colors.textMuted, fontSize: typography.body, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: "#f0e8f4", ...shadow.card },
  metricStrip: { flexDirection: "row", paddingVertical: spacing.sm },
  metricItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  metricItemCompact: { flexDirection: "column", gap: 4, paddingHorizontal: 2 },
  metricDivider: { borderLeftWidth: 1, borderLeftColor: colors.outlineVariant },
  metricTextCompact: { alignItems: "center" },
  metricLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  metricLabelCompact: { textAlign: "center", fontSize: 10, lineHeight: 12 },
  metricValue: { color: colors.text, fontSize: 21, fontWeight: "900" },
  actionGrid: { flexDirection: "row", gap: spacing.sm },
  actionGridCompact: { flexWrap: "wrap" },
  actionCard: { minHeight: 150, alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.sm },
  actionCardWide: { flex: 1 },
  actionCardCompact: { flexGrow: 1, flexBasis: "47%", maxWidth: "49%", minHeight: 136 },
  actionTitle: { color: colors.text, textAlign: "center", fontWeight: "800", fontSize: 13, lineHeight: 17 },
  actionSubtitle: { color: colors.textMuted, textAlign: "center", fontSize: 10, lineHeight: 14, minHeight: 28 },
  actionLinkRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  actionLink: { fontWeight: "800", fontSize: 12 },
  queueRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: "#f2edf5" },
  queueRowLast: { borderBottomWidth: 0 },
  queueIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  queueIconText: { fontSize: 18, fontWeight: "900" },
  queueText: { flex: 1 },
  queueTitle: { color: colors.text, fontWeight: "800", fontSize: 14 },
  queueSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  queueValue: { fontSize: 22, fontWeight: "900" },
  chevron: { color: colors.outline, fontSize: 22 },
  cover: { width: 92, height: 118, borderRadius: radius.md, padding: spacing.sm, justifyContent: "flex-end", overflow: "hidden" },
  coverSmall: { width: 72, height: 72 },
  coverImage: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  coverShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: "48%", backgroundColor: "rgba(18, 9, 39, 0.34)" },
  coverGlow: { position: "absolute", left: 12, top: 12, width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.16)" },
  coverTitle: { color: colors.surface, fontWeight: "900", fontSize: 14, textTransform: "uppercase" },
  coverTitleOverlay: { position: "relative", textShadowColor: "rgba(0,0,0,0.45)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceContainer, overflow: "hidden", marginTop: spacing.sm },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  seriesRow: { flexDirection: "row", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: "#f0e8f4", ...shadow.card },
  seriesRowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  seriesBody: { flex: 1, gap: 5 },
  seriesHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  seriesTitle: { color: colors.text, fontSize: 16, fontWeight: "900", flex: 1 },
  seriesTags: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  seriesTag: { color: colors.primary, backgroundColor: colors.chip, borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: "700" },
  seriesMeta: { color: colors.textMuted, fontSize: 11 },
  seriesProgress: { color: colors.primary, fontSize: 12, fontWeight: "800", marginTop: 4 },
  seriesActionPill: { minHeight: 34, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: spacing.sm, alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 2, marginTop: spacing.xs },
  seriesAction: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  seriesActionPillSelected: { backgroundColor: colors.primary },
  seriesActionSelected: { color: colors.surface },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "800" },
  button: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  buttonText: { fontWeight: "900", fontSize: 14 },
  confirmationPanel: { gap: spacing.sm, backgroundColor: colors.surface },
  confirmationHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  confirmationTitleBlock: { flex: 1 },
  confirmationKicker: { color: colors.textMuted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  confirmationTitle: { color: colors.text, fontSize: 16, fontWeight: "900", marginTop: 2 },
  confirmationBody: { color: colors.text, fontSize: 13, lineHeight: 20 },
  confirmationHint: { color: colors.primary, backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 7, fontSize: 11, fontWeight: "800" },
  confirmationActions: { flexDirection: "row", gap: spacing.sm },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  sectionAction: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  activityRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 7 },
  activityIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  activityTitle: { flex: 1, color: colors.text, fontSize: 12 },
  activityTime: { color: colors.outline, fontSize: 11 },
  segmented: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg, padding: 4, borderWidth: 1, borderColor: colors.outlineVariant },
  segment: { flex: 1, minHeight: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: colors.primarySoft },
  segmentText: { color: colors.textMuted, fontWeight: "700", fontSize: 12 },
  segmentTextActive: { color: colors.primary, fontWeight: "900" },
})
