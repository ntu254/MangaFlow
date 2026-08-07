import { Image } from "expo-image"
import { Pressable, StyleSheet, Text, View } from "react-native"
import type { MobileWorkItem } from "@/domain/mobile-work-item"
import { resolveDisplayUrl } from "@/domain/review-files"
import { getMobileApiBaseUrl } from "@/services/mobile-api-config"
import { colors, radius, shadow, spacing, typography } from "@/design/tokens"

const shadowlineCover = require("../../assets/images/biatruyen.jpg")
const crimsonRoadCover = require("../../assets/images/biatruyen1.jpg")
const monsterCoverUrl = "https://tradejapanstore.com/cdn/shop/files/322501000882.webp?v=1759906452"

const coverAssets = [shadowlineCover, crimsonRoadCover, { uri: monsterCoverUrl }]

// A real cover reaches mobile as an absolute, server-signed URL in
// item.summary.coverUrl (createDisplayUrl in file-access.service.ts).
// resolveDisplayUrl rewrites a localhost origin onto the configured mobile
// API base, which matters when the backend has no PUBLIC_API_BASE_URL set —
// "localhost" from a phone would otherwise point at the phone itself.
//
// Anything non-absolute is not resolvable into a working image here: a bare
// coverFileKey cannot be used because /files/display/:token needs a
// server-signed token, and seed placeholders like "/assets/covers/berserk.jpg"
// are not served by the backend at all. Those fall back to a stable
// per-item local placeholder instead of a request that would just fail.
function getWorkItemCoverSource(item: MobileWorkItem) {
  const rawCoverUrl = typeof item.summary?.coverUrl === "string" ? item.summary.coverUrl.trim() : ""
  const isAbsoluteUrl =
    rawCoverUrl.startsWith("data:") ||
    rawCoverUrl.startsWith("file:") ||
    rawCoverUrl.startsWith("http://") ||
    rawCoverUrl.startsWith("https://")

  if (isAbsoluteUrl) {
    if (rawCoverUrl.startsWith("data:") || rawCoverUrl.startsWith("file:")) {
      return { uri: rawCoverUrl }
    }
    return { uri: resolveDisplayUrl(rawCoverUrl, getMobileApiBaseUrl()) }
  }

  const seedKey = item.id + (item.title || "")
  const sum = seedKey.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return coverAssets[sum % coverAssets.length]
}

const PRIORITY_COLOR: Record<MobileWorkItem["priority"]["level"], { bar: string; text: string; bg: string }> = {
  URGENT: { bar: colors.danger, text: colors.dangerText, bg: colors.dangerSoft },
  HIGH: { bar: colors.warning, text: colors.warningText, bg: colors.warningSoft },
  NORMAL: { bar: colors.primary, text: colors.primary, bg: colors.primarySoft },
}

const WORK_TYPE_LABEL: Record<MobileWorkItem["kind"], string> = {
  PROPOSAL_REVIEW: "Proposal review",
  CHAPTER_REVIEW: "Chapter review",
  COMMENT_REVIEW: "Comment review",
  PUBLICATION: "Publication",
  BOARD_VOTE: "Board vote",
  SESSION_FINALIZE: "Session finalization",
  BOARD_REVOTE: "Board revote",
  AT_RISK: "At risk",
}

function normalizedObjectName(item: MobileWorkItem) {
  const objectType = item.entityType
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
  const title = item.title.trim()

  return title.toLowerCase().startsWith(objectType.toLowerCase()) ? title : `${objectType} ${title}`
}

function getBadgeStyle(label: string) {
  const upper = label.toUpperCase()
  if (upper.includes("URGENT") || upper.includes("BLOCK") || upper.includes("REJECT")) {
    return { bg: colors.dangerSoft, text: colors.dangerText }
  }
  if (upper.includes("WARN") || upper.includes("REVISION") || upper.includes("REVISION_REQUESTED")) {
    return { bg: colors.warningSoft, text: colors.warningText }
  }
  if (upper.includes("APPROV") || upper.includes("READY") || upper.includes("DONE")) {
    return { bg: colors.successSoft, text: colors.successText }
  }
  return { bg: colors.primarySoft, text: colors.primary }
}

// Read-only queue card. Consequential actions live on the detail surface, never
// here, so a card only opens its item. Shows at most two status/blocker badges.
export function WorkItemCard({
  item,
  onSelect,
  variant = "list",
}: {
  item: MobileWorkItem
  onSelect: (item: MobileWorkItem) => void
  variant?: "list" | "grid"
}) {
  if (item.kind === "PUBLICATION" && !item.chapterContext) {
    throw new Error("Publication work item is missing chapter context.")
  }

  const publicationContext = item.kind === "PUBLICATION" ? item.chapterContext : undefined
  const badges = [
    { key: "status", label: item.status },
    ...item.blockers.slice(0, 1).map((blocker) => ({ key: blocker.code, label: blocker.label })),
  ].slice(0, 2)

  const eyebrow = publicationContext
    ? `Publication · Chapter ${publicationContext.chapterNumber}`
    : `${WORK_TYPE_LABEL[item.kind]} · ${normalizedObjectName(item)}`

  const gridEyebrow = publicationContext
    ? `Publication · Chapter ${publicationContext.chapterNumber}`
    : WORK_TYPE_LABEL[item.kind]

  const title = publicationContext?.seriesTitle ?? item.title
  const subtitle = publicationContext
    ? `${publicationContext.chapterTitle} · ${item.subtitle}`
    : item.subtitle

  const priorityStyle = PRIORITY_COLOR[item.priority.level]
  const coverSource = getWorkItemCoverSource(item)

  if (variant === "grid") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${title}, ${item.status}, ${item.priority.reason}`}
        onPress={() => onSelect(item)}
        style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}
      >
        <View style={styles.gridCoverContainer}>
          <Image source={coverSource} style={styles.gridCoverImage} contentFit="cover" transition={150} />
          <View style={styles.gridCoverOverlay}>
            <View style={[styles.priorityTag, { backgroundColor: priorityStyle.bg }]}>
              <View style={[styles.priorityDot, { backgroundColor: priorityStyle.bar }]} />
              <Text style={[styles.reason, { color: priorityStyle.text }]} numberOfLines={1}>
                {item.priority.reason}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.gridContent}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {gridEyebrow}
          </Text>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>

          <View style={styles.badgeRow}>
            {badges.map((badge) => {
              const bStyle = getBadgeStyle(badge.label)
              return (
                <View key={badge.key} style={[styles.badge, { backgroundColor: bStyle.bg }]}>
                  <Text style={[styles.badgeText, { color: bStyle.text }]}>{badge.label}</Text>
                </View>
              )
            })}
          </View>
        </View>
      </Pressable>
    )
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}, ${item.status}, ${item.priority.reason}`}
      onPress={() => onSelect(item)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.priorityBar, { backgroundColor: priorityStyle.bar }]} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={[styles.priorityTag, { backgroundColor: priorityStyle.bg }]}>
            <View style={[styles.priorityDot, { backgroundColor: priorityStyle.bar }]} />
            <Text style={[styles.reason, { color: priorityStyle.text }]}>{item.priority.reason}</Text>
          </View>
        </View>

        <Text style={styles.eyebrow} numberOfLines={1}>
          {eyebrow}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>

        <View style={styles.badgeRow}>
          {badges.map((badge) => {
            const bStyle = getBadgeStyle(badge.label)
            return (
              <View key={badge.key} style={[styles.badge, { backgroundColor: bStyle.bg }]}>
                <Text style={[styles.badgeText, { color: bStyle.text }]}>{badge.label}</Text>
              </View>
            )
          })}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    minHeight: 44,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: shadow.card.shadowColor,
    shadowOpacity: shadow.card.shadowOpacity,
    shadowRadius: shadow.card.shadowRadius,
    shadowOffset: shadow.card.shadowOffset,
    elevation: shadow.card.elevation,
  },
  gridCard: {
    flex: 1,
    width: "100%",
    minHeight: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: "hidden",
    shadowColor: shadow.card.shadowColor,
    shadowOpacity: shadow.card.shadowOpacity,
    shadowRadius: shadow.card.shadowRadius,
    shadowOffset: shadow.card.shadowOffset,
    elevation: shadow.card.elevation,
  },
  gridCoverContainer: {
    width: "100%",
    height: 140,
    backgroundColor: colors.surfaceContainer,
    position: "relative",
  },
  gridCoverImage: {
    width: "100%",
    height: "100%",
  },
  gridCoverOverlay: {
    position: "absolute",
    top: spacing.xs,
    left: spacing.xs,
    right: spacing.xs,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridContent: {
    padding: spacing.sm,
    gap: 4,
    flex: 1,
    justifyContent: "space-between",
  },
  gridTitle: {
    fontSize: typography.body,
    color: colors.text,
    fontWeight: "700",
    lineHeight: 18,
  },
  pressed: { backgroundColor: colors.surfaceLow, transform: [{ scale: 0.995 }] },
  priorityBar: {
    width: 5,
    height: "100%",
  },
  content: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priorityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  priorityDot: { width: 6, height: 6, borderRadius: radius.full },
  reason: { fontSize: typography.label, fontWeight: "700" },
  eyebrow: { fontSize: typography.label, color: colors.primary, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  title: { fontSize: typography.subtitle, color: colors.text, fontWeight: "700", lineHeight: 22 },
  subtitle: { fontSize: typography.body, color: colors.textMuted },
  badgeRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs, flexWrap: "wrap" },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  badgeText: { fontSize: typography.label, fontWeight: "700" },
})


