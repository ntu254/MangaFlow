import type { ReactNode } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { colors, spacing, typography } from "@/design/tokens"

// Shared detail scaffold: a scrollable body with a header, and a sticky action
// bar pinned to the bottom.
export function WorkflowDetailLayout({
  title,
  subtitle,
  children,
  actionBar,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  actionBar?: ReactNode
}) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </ScrollView>
      {actionBar}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm },
  title: { fontSize: typography.title, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: typography.body, color: colors.textMuted },
})
