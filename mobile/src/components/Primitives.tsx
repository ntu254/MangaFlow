import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle
} from "react-native";
import { colors, radii, shadow, spacing } from "../theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function Screen({
  children,
  title,
  subtitle,
  unreadCount,
  status
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  unreadCount?: number;
  status?: ReactNode;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.roleLabel}>{subtitle}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.bell}>
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          {unreadCount ? <Text style={styles.bellBadge}>{unreadCount}</Text> : null}
        </View>
      </View>
      {status}
      {children}
    </View>
  );
}

export function Card({
  children,
  style
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function MetricCard({
  label,
  value,
  color = colors.primary
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  const isLongValue = typeof value === "string" && value.length > 8;

  return (
    <Card style={styles.metricCard}>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.82}
        numberOfLines={isLongValue ? 2 : 1}
        style={[styles.metricValue, isLongValue ? styles.metricValueLong : null, { color }]}
      >
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

export function Badge({
  label,
  tone = "default"
}: {
  label: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneStyle = {
    default: { backgroundColor: "#ece5ff", color: colors.primary },
    warning: { backgroundColor: "#fff0c2", color: colors.warningText },
    danger: { backgroundColor: "#ffe1e8", color: "#e11d48" },
    success: { backgroundColor: "#f4ffd2", color: colors.successText }
  }[tone];

  return (
    <Text
      style={[
        styles.badge,
        { backgroundColor: toneStyle.backgroundColor, color: toneStyle.color }
      ]}
    >
      {label}
    </Text>
  );
}

export function ActionButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  icon
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "warning";
  disabled?: boolean;
  icon?: IconName;
}) {
  const variantStyle = {
    primary: { backgroundColor: colors.primary, color: "#ffffff" },
    secondary: { backgroundColor: "#ffe6f2", color: colors.pinkPurple },
    danger: { backgroundColor: colors.rosePink, color: "#ffffff" },
    warning: { backgroundColor: colors.softYellow, color: "#3a2a00" }
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: variantStyle.backgroundColor },
        disabled ? styles.buttonDisabled : null
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={18} color={variantStyle.color} />
      ) : null}
      <Text style={[styles.buttonText, { color: variantStyle.color }]}>{label}</Text>
    </Pressable>
  );
}

export function StateBanner({
  title,
  message,
  tone = "info",
  onRetry
}: {
  title: string;
  message: string;
  tone?: "info" | "warning" | "danger" | "success";
  onRetry?: () => void;
}) {
  const toneStyle = {
    info: { backgroundColor: colors.bgCanvas, borderColor: colors.borderDefault },
    warning: { backgroundColor: colors.bgPanel, borderColor: colors.softYellow },
    danger: { backgroundColor: "#fff1f2", borderColor: colors.rosePink },
    success: { backgroundColor: "#fbffe8", borderColor: colors.pastelLime }
  }[tone];

  return (
    <View style={[styles.stateBanner, toneStyle]}>
      <View style={styles.stateText}>
        <Text style={styles.stateTitle}>{title}</Text>
        <Text style={styles.stateMessage}>{message}</Text>
      </View>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.stateRetry}>
          <Ionicons name="refresh" size={17} color={colors.primary} />
          <Text style={styles.stateRetryText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  title,
  message
}: {
  title: string;
  message: string;
}) {
  return (
    <Card style={styles.emptyCard}>
      <Ionicons name="file-tray-outline" size={28} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </Card>
  );
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalActions}>
            <ActionButton label="Cancel" onPress={onCancel} variant="secondary" />
            <ActionButton label={confirmLabel} onPress={onConfirm} variant="danger" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 112
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  roleLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 31,
    letterSpacing: 0
  },
  bell: {
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderColor: colors.borderDefault,
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44
  },
  bellBadge: {
    backgroundColor: colors.rosePink,
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 2,
    position: "absolute",
    right: -2,
    textAlign: "center",
    top: -4
  },
  card: {
    backgroundColor: colors.bgCard,
    borderColor: colors.borderDefault,
    borderRadius: radii.sm,
    borderWidth: 1,
    padding: spacing.md,
    shadowColor: colors.pinkPurple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 2
  },
  metricCard: {
    flex: 1,
    minHeight: 104,
    minWidth: 132,
    paddingVertical: spacing.md
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 29
  },
  metricValueLong: {
    fontSize: 18,
    lineHeight: 22
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: spacing.xs
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5
  },
  button: {
    alignItems: "center",
    borderRadius: radii.sm,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  buttonDisabled: {
    opacity: 0.45
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "800"
  },
  stateBanner: {
    alignItems: "center",
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  stateText: {
    flex: 1,
    gap: spacing.xs
  },
  stateTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900"
  },
  stateMessage: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16
  },
  stateRetry: {
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderColor: colors.borderDefault,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.sm
  },
  stateRetryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900"
  },
  emptyCard: {
    alignItems: "center",
    gap: spacing.sm
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center"
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center"
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(47, 36, 58, 0.28)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  modalCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    gap: spacing.lg,
    padding: spacing.xxl,
    width: "100%"
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800"
  },
  modalMessage: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "flex-end"
  }
});

