import { StyleSheet } from "react-native";
import { colors, radii, shadow, spacing } from "../theme";

export const appStyles = StyleSheet.create({
  app: {
    backgroundColor: colors.bgMain,
    flex: 1
  },
  stack: {
    gap: spacing.md
  },
  rowBetween: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  cardTitle: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.sm
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18
  },
  inlineMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md
  },
  progressTrack: {
    backgroundColor: colors.bgSoft,
    borderRadius: 999,
    height: 9,
    marginTop: spacing.lg,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: "100%"
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg
  },
  roleSwitch: {
    backgroundColor: colors.bgMain,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.sm
  },
  tabs: {
    backgroundColor: colors.bgSidebar,
    borderColor: colors.borderDefault,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between",
    left: 0,
    padding: spacing.sm,
    position: "absolute",
    right: 0,
    ...shadow
  },
  tabItem: {
    alignItems: "center",
    borderRadius: radii.md,
    color: colors.textMuted,
    flex: 1,
    fontSize: 11,
    fontWeight: "800",
    minHeight: 54,
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    textAlign: "center"
  },
  tabItemActive: {
    backgroundColor: colors.bgCard,
    color: colors.primary
  }
});
