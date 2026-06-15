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
  unreadCount
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  unreadCount?: number;
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
  return (
    <Card style={styles.metricCard}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
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
    gap: spacing.lg,
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
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0
  },
  bell: {
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderColor: colors.borderDefault,
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    position: "relative",
    width: 48
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
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadow
  },
  metricCard: {
    flex: 1,
    minWidth: 148
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "800"
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: spacing.xs
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: 6
  },
  button: {
    alignItems: "center",
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  buttonDisabled: {
    opacity: 0.45
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "800"
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

