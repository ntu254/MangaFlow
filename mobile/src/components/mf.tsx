import type { PropsWithChildren, ReactNode } from "react"
import { Image } from "expo-image"
import { Keyboard, Pressable, StyleSheet, Text, TextInput, type ViewStyle, useWindowDimensions, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MFHeaderBackground } from "@/components/header-background"
import { colors, radius, shadow, spacing, typography } from "@/design/tokens"
import { MFIcon, type IconName } from "@/design/icons"
import type { MetricItem, QueueItem, Role, SeriesCard, Tone } from "@/domain/workflow"

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
  /** Live unread count rendered on the tab. Omit or 0 hides the badge. */
  badgeCount?: number
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
        <Pressable style={styles.content} onPress={Keyboard.dismiss}>
          {children}
        </Pressable>
      </SafeAreaView>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = tab.id === activeTab
          const badge = tab.badgeCount ?? 0
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={badge > 0 ? `${tab.label}, ${badge} unread` : tab.label}
              hitSlop={8}
              onPress={() => onTabChange(tab.id)}
              style={styles.tabButton}
            >
              <View>
                <MFIcon name={tab.icon} size={22} color={active ? colors.primary : colors.outline} />
                {badge > 0 ? (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{badge > 99 ? "99+" : badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[styles.tabLabel, active && styles.tabLabelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {tab.label}
              </Text>
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
}

// Identity and account controls only. Notifications live in the bottom tab bar,
// where the badge comes from live notification data.
export function MFHeader({ role, userName, subtitle, logoSuffix }: MFHeaderProps) {
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
  return <View style={[styles.badge, { backgroundColor: swatch.bg }]}><Text style={[styles.badgeText, { color: swatch.fg }]} numberOfLines={2}>{children}</Text></View>
}

export function MFIconCircle({ tone, icon, size = 42 }: { tone: Tone; icon: IconName; size?: number }) {
  const swatch = toneColors[tone]
  return (
    <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: swatch.bg }]}>
      <MFIcon name={icon} size={Math.max(18, Math.round(size * 0.48))} color={swatch.fg} />
    </View>
  )
}

export function MFStateNotice({
  loading,
  error,
  message,
  loadingLabel = "Loading mobile workflow...",
}: {
  loading: boolean
  error: string | null
  message: string
  loadingLabel?: string
}) {
  if (error) {
    return (
      <MFCard style={styles.stateNoticeError}>
        <MFIconCircle tone="danger" icon="alert-triangle" size={38} />
        <View style={styles.stateNoticeBody}>
          <Text style={styles.stateNoticeTitle}>Could not load this mobile flow</Text>
          <Text style={styles.stateNoticeText}>{error}</Text>
        </View>
      </MFCard>
    )
  }

  if (loading) {
    return (
      <MFCard style={styles.stateNoticeLoading}>
        <MFIconCircle tone="primary" icon="refresh-cw" size={38} />
        <View style={styles.stateNoticeBody}>
          <Text style={styles.stateNoticeTitle}>{loadingLabel}</Text>
          <Text style={styles.stateNoticeText}>Reading through the async mobile data-source boundary.</Text>
        </View>
      </MFCard>
    )
  }

  return <Text style={styles.inlineStateMessage}>{message}</Text>
}

export function MFEmptyState({
  title,
  subtitle,
  icon = "file-text",
  tone = "neutral",
}: {
  title: string
  subtitle: string
  icon?: IconName
  tone?: Tone
}) {
  return (
    <MFCard style={styles.emptyState}>
      <MFIconCircle tone={tone} icon={icon} size={48} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </MFCard>
  )
}

export function MFDetailList({
  items,
}: {
  items: Array<{ id: string; label: string; value: string; tone?: Tone; icon?: IconName }>
}) {
  return (
    <MFCard>
      {items.map((item, index) => {
        const tone = item.tone ?? "neutral"
        const swatch = toneColors[tone]
        return (
          <View key={item.id} style={[styles.detailRow, index === items.length - 1 && styles.detailRowLast]}>
            <View style={[styles.detailIcon, { backgroundColor: swatch.bg }]}>
              <MFIcon name={item.icon ?? defaultQueueIcons[tone]} size={17} color={swatch.fg} />
            </View>
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          </View>
        )
      })}
    </MFCard>
  )
}

export function MFTimeline({
  items,
}: {
  items: Array<{ id: string; title: string; subtitle: string; tone: Tone; icon?: IconName }>
}) {
  return (
    <MFCard>
      {items.map((item, index) => {
        const swatch = toneColors[item.tone]
        return (
          <View key={item.id} style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View style={[styles.timelineDot, { backgroundColor: swatch.bg, borderColor: swatch.fg }]}>
                <MFIcon name={item.icon ?? defaultActivityIcons[item.tone]} size={13} color={swatch.fg} />
              </View>
              {index < items.length - 1 ? <View style={styles.timelineLine} /> : null}
            </View>
            <View style={styles.timelineText}>
              <Text style={styles.timelineTitle}>{item.title}</Text>
              <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )
      })}
    </MFCard>
  )
}

export function MFButton({
  tone = "primary",
  children,
  variant = "filled",
  onPress,
  accessibilityLabel,
  style,
  disabled = false,
}: PropsWithChildren<{ tone?: Tone; variant?: "filled" | "outline" | "soft"; onPress?: () => void; accessibilityLabel?: string; style?: ViewStyle; disabled?: boolean }>) {
  const swatch = toneColors[tone]
  const buttonStyle =
    variant === "filled"
      ? { backgroundColor: swatch.fg, borderColor: swatch.fg }
      : variant === "soft"
        ? { backgroundColor: swatch.bg, borderColor: swatch.bg }
        : { backgroundColor: swatch.bg, borderColor: swatch.fg }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, buttonStyle, disabled && styles.buttonDisabled, style]}
    >
      <Text style={[styles.buttonText, { color: variant === "filled" ? colors.surface : swatch.fg }]} numberOfLines={2}>{children}</Text>
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
  noteValue,
  onChangeNote,
  notePlaceholder,
  noteLabel,
  errorText,
  busy = false,
  confirmDisabled = false,
}: {
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  tone?: Tone
  endpointHint?: string
  onConfirm: () => void
  onCancel: () => void
  noteValue?: string
  onChangeNote?: (value: string) => void
  notePlaceholder?: string
  noteLabel?: string
  errorText?: string | null
  busy?: boolean
  confirmDisabled?: boolean
}) {
  const swatch = toneColors[tone]
  const showNote = typeof onChangeNote === "function"

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
      {showNote ? (
        <View style={styles.confirmationNoteGroup}>
          {noteLabel ? <Text style={styles.confirmationNoteLabel}>{noteLabel}</Text> : null}
          <TextInput
            value={noteValue}
            onChangeText={onChangeNote}
            editable={!busy}
            placeholder={notePlaceholder}
            placeholderTextColor={colors.outline}
            multiline
            style={styles.confirmationNoteInput}
          />
        </View>
      ) : null}
      {errorText ? <Text style={styles.confirmationError}>{errorText}</Text> : null}
      {endpointHint ? <Text style={styles.confirmationHint}>{endpointHint}</Text> : null}
      <View style={styles.confirmationActions}>
        <MFButton tone={tone} style={styles.confirmationActionButton} onPress={onConfirm} disabled={busy || confirmDisabled}>{busy ? "Submitting..." : confirmLabel}</MFButton>
        <MFButton tone="neutral" variant="soft" style={styles.confirmationActionButton} onPress={onCancel} disabled={busy}>{cancelLabel}</MFButton>
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
  const compactCards = width <= 620

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
  if (items.length === 0) {
    return (
      <MFEmptyState
        title="No queue items"
        subtitle="This mobile route stays available while the API returns an empty list."
        icon="check-circle"
        tone="success"
      />
    )
  }

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
              <Text style={styles.queueTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.queueSubtitle} numberOfLines={3}>{item.subtitle}</Text>
            </View>
            {item.value ? (
              <View style={[styles.queueValuePill, { backgroundColor: swatch.bg }]}>
                <Text style={[styles.queueValue, { color: swatch.fg }]} numberOfLines={2}>{item.value}</Text>
              </View>
            ) : null}
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
          <Text style={styles.seriesTitle} numberOfLines={2}>{item.title}</Text>
          <MFBadge tone={item.tone}>{item.status}</MFBadge>
        </View>
        <View style={styles.seriesTags}>
          {tags.map((tag) => <Text key={tag} style={styles.seriesTag} numberOfLines={2}>{tag}</Text>)}
        </View>
        <Text style={styles.seriesMeta} numberOfLines={2}>{item.meta}</Text>
        {typeof item.progressValue === "number" ? (
          <>
            <Text style={styles.seriesProgress}>{item.progress}</Text>
            <MFProgress value={item.progressValue} />
          </>
        ) : null}
        <View style={[styles.seriesActionPill, selected && styles.seriesActionPillSelected]}>
          <Text style={[styles.seriesAction, selected && styles.seriesActionSelected]} numberOfLines={2}>{selected ? "Selected" : actionLabel}</Text>
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
      {action ? <Text style={styles.sectionAction} numberOfLines={1}>{action}</Text> : null}
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
            <Text style={styles.activityTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.activityTime} numberOfLines={1}>{item.time}</Text>
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
          <Text style={[styles.segmentText, index === activeIndex && styles.segmentTextActive]} numberOfLines={2}>{label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1, zIndex: 1 },
  content: { flex: 1 },
  tabBar: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10, elevation: 10, flexDirection: "row", justifyContent: "space-around", paddingTop: spacing.sm, paddingBottom: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  tabButton: { flex: 1, minWidth: 0, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 2, paddingHorizontal: 2 },
  tabLabel: { fontSize: 11, color: colors.outline, fontWeight: "600", maxWidth: "100%" },
  tabLabelActive: { color: colors.primary },
  header: { minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 0 },
  logoMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logoMarkText: { color: colors.surface, fontSize: 22, fontWeight: "900" },
  logoText: { color: colors.primary, fontSize: 19, fontWeight: "900" },
  logoSuffix: { color: colors.primary, fontSize: 9, fontWeight: "800", letterSpacing: 4 },
  headerRight: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: spacing.sm, minWidth: 0 },
  tabBadge: { position: "absolute", right: -10, top: -6, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  tabBadgeText: { color: colors.surface, fontSize: 10, fontWeight: "800" },
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
  metricItem: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  metricItemCompact: { flexDirection: "column", gap: 4, paddingHorizontal: 2 },
  metricDivider: { borderLeftWidth: 1, borderLeftColor: colors.outlineVariant },
  metricTextCompact: { alignItems: "center" },
  metricLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  metricLabelCompact: { textAlign: "center", fontSize: 10, lineHeight: 12 },
  metricValue: { color: colors.text, fontSize: 21, fontWeight: "900" },
  actionGrid: { flexDirection: "row", gap: spacing.sm },
  actionGridCompact: { flexWrap: "wrap" },
  actionCard: { minHeight: 150, alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.sm, gap: spacing.xs },
  actionCardWide: { flex: 1 },
  actionCardCompact: { flexGrow: 1, flexBasis: "47%", maxWidth: "49%", minHeight: 136 },
  actionTitle: { color: colors.text, textAlign: "center", fontWeight: "800", fontSize: 13, lineHeight: 17 },
  actionSubtitle: { color: colors.textMuted, textAlign: "center", fontSize: 10, lineHeight: 14, minHeight: 28 },
  actionLinkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2, minHeight: 30, borderRadius: radius.full, paddingHorizontal: spacing.sm, backgroundColor: colors.surfaceLow, maxWidth: "100%" },
  actionLink: { fontWeight: "800", fontSize: 12, flexShrink: 1 },
  queueRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: "#f2edf5" },
  queueRowLast: { borderBottomWidth: 0 },
  queueIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  queueIconText: { fontSize: 18, fontWeight: "900" },
  queueText: { flex: 1, minWidth: 0 },
  queueTitle: { color: colors.text, fontWeight: "800", fontSize: 14 },
  queueSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  queueValuePill: { minWidth: 52, maxWidth: 108, minHeight: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  queueValue: { fontSize: 13, lineHeight: 15, fontWeight: "900", textAlign: "center" },
  chevron: { color: colors.outline, fontSize: 22 },
  cover: { width: 92, height: 118, borderRadius: radius.md, padding: spacing.sm, justifyContent: "flex-end", overflow: "hidden" },
  coverSmall: { width: 72, height: 72 },
  coverImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  coverShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: "48%", backgroundColor: "rgba(18, 9, 39, 0.34)" },
  coverGlow: { position: "absolute", left: 12, top: 12, width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.16)" },
  coverTitle: { color: colors.surface, fontWeight: "900", fontSize: 14, textTransform: "uppercase" },
  coverTitleOverlay: { position: "relative", textShadowColor: "rgba(0,0,0,0.45)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceContainer, overflow: "hidden", marginTop: spacing.sm },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  seriesRow: { flexDirection: "row", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: "#f0e8f4", ...shadow.card },
  seriesRowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  seriesBody: { flex: 1, minWidth: 0, gap: 5 },
  seriesHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  seriesTitle: { color: colors.text, fontSize: 16, fontWeight: "900", flex: 1 },
  seriesTags: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  seriesTag: { color: colors.primary, backgroundColor: colors.chip, borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: "700" },
  seriesMeta: { color: colors.textMuted, fontSize: 11 },
  seriesProgress: { color: colors.primary, fontSize: 12, fontWeight: "800", marginTop: 4 },
  seriesActionPill: { minHeight: 34, maxWidth: "100%", borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: spacing.sm, alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 2, marginTop: spacing.xs },
  seriesAction: { color: colors.primary, fontSize: 12, lineHeight: 15, fontWeight: "800", flexShrink: 1, textAlign: "center" },
  seriesActionPillSelected: { backgroundColor: colors.primary },
  seriesActionSelected: { color: colors.surface },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, alignSelf: "flex-start", maxWidth: 168 },
  badgeText: { fontSize: 11, lineHeight: 13, fontWeight: "800", textAlign: "center" },
  button: { minHeight: 50, borderRadius: radius.full, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md, paddingVertical: 8 },
  buttonText: { fontWeight: "900", fontSize: 13, lineHeight: 17, textAlign: "center" },
  buttonDisabled: { opacity: 0.55 },
  confirmationPanel: { gap: spacing.sm, backgroundColor: colors.surface },
  confirmationHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  confirmationTitleBlock: { flex: 1, minWidth: 0 },
  confirmationKicker: { color: colors.textMuted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  confirmationTitle: { color: colors.text, fontSize: 16, fontWeight: "900", marginTop: 2 },
  confirmationBody: { color: colors.text, fontSize: 13, lineHeight: 20 },
  confirmationHint: { color: colors.primary, backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 7, fontSize: 11, fontWeight: "800" },
  confirmationActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  confirmationActionButton: { flexGrow: 1, flexBasis: "47%", minWidth: 0 },
  confirmationNoteGroup: { gap: spacing.xs },
  confirmationNoteLabel: { color: colors.text, fontSize: 12, fontWeight: "800" },
  confirmationNoteInput: { minHeight: 64, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.md, backgroundColor: colors.surfaceLow, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, color: colors.text, fontSize: 13, textAlignVertical: "top" },
  confirmationError: { color: colors.danger, fontSize: 12, fontWeight: "800", lineHeight: 17 },
  stateNoticeError: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  stateNoticeLoading: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  stateNoticeBody: { flex: 1 },
  stateNoticeTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
  stateNoticeText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 2 },
  inlineStateMessage: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  emptyState: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "900", textAlign: "center" },
  emptySubtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  detailRowLast: { borderBottomWidth: 0 },
  detailIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  detailText: { flex: 1 },
  detailLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  detailValue: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: "700", marginTop: 2 },
  timelineRow: { flexDirection: "row", gap: spacing.sm, minHeight: 54 },
  timelineRail: { width: 28, alignItems: "center" },
  timelineDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.outlineVariant, marginVertical: 3 },
  timelineText: { flex: 1, paddingBottom: spacing.sm },
  timelineTitle: { color: colors.text, fontSize: 13, fontWeight: "900" },
  timelineSubtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  sectionAction: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  activityRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 7 },
  activityIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  activityTitle: { flex: 1, color: colors.text, fontSize: 12 },
  activityTime: { color: colors.outline, fontSize: 11 },
  segmented: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg, padding: 4, borderWidth: 1, borderColor: colors.outlineVariant },
  segment: { flex: 1, minWidth: 0, minHeight: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  segmentActive: { backgroundColor: colors.primarySoft },
  segmentText: { color: colors.textMuted, fontWeight: "700", fontSize: 11, lineHeight: 14, textAlign: "center", flexShrink: 1 },
  segmentTextActive: { color: colors.primary, fontWeight: "900" },
})
