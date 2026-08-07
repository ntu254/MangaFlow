import type { ReactNode } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { colors, radius, shadow, spacing, typography } from "@/design/tokens"

// Shared detail scaffold: a scrollable body with a header and optional actions
// following the detail content.
export function WorkflowDetailLayout({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <View style={styles.subtitleTag}>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          ) : null}
        </View>
        {children}
        {actions}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  headerCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.xs,
    shadowColor: shadow.sm.shadowColor,
    shadowOpacity: shadow.sm.shadowOpacity,
    shadowRadius: shadow.sm.shadowRadius,
    shadowOffset: shadow.sm.shadowOffset,
    elevation: shadow.sm.elevation,
  },
  title: { fontSize: typography.hero, fontWeight: "800", color: colors.text, lineHeight: 28 },
  subtitleTag: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: 2,
  },
  subtitle: { fontSize: typography.label, fontWeight: "700", color: colors.primary },
})

