import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { MFIcon } from "@/design/icons";
import { colors, radius, spacing } from "@/design/tokens";
import { shouldRefreshLease, type FileUrlLease, type ReviewFile } from "@/domain/review-files";
import {
  MobileFileReviewHttpError,
  openReviewFile,
  type MobileApiRole,
} from "@/services/mobile-file-review";

type ViewerStatus = "loading" | "ready" | "unavailable" | "denied" | "error";

export function ReviewFileViewer({
  file,
  role,
  visible,
  onClose,
}: {
  file: ReviewFile | null;
  role: MobileApiRole;
  visible: boolean;
  onClose: () => void;
}) {
  const [lease, setLease] = useState<FileUrlLease | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const hasRetriedRef = useRef(false);

  const clearAndClose = useCallback(() => {
    setLease(null);
    onClose();
  }, [onClose]);

  const acquireUrl = useCallback(async () => {
    if (!file) return;
    setStatus("loading");
    try {
      const nextLease = await openReviewFile(file, role);
      setLease(nextLease);
      setStatus("ready");
    } catch (error) {
      if (error instanceof MobileFileReviewHttpError && error.status === 403) {
        setLease(null);
        setStatus("denied");
        clearAndClose();
        return;
      }
      setStatus(error instanceof MobileFileReviewHttpError && error.status === 404 ? "unavailable" : "error");
    }
  }, [clearAndClose, file, role]);

  useEffect(() => {
    if (!visible || !file) return;
    hasRetriedRef.current = false;
    setLease(null);
    void acquireUrl();
  }, [acquireUrl, file, visible]);

  const refreshAfterFailure = useCallback(() => {
    if (hasRetriedRef.current) {
      setStatus("error");
      return;
    }
    hasRetriedRef.current = true;
    setLease(null);
    void acquireUrl();
  }, [acquireUrl]);

  const retry = useCallback(() => {
    hasRetriedRef.current = false;
    setLease(null);
    void acquireUrl();
  }, [acquireUrl]);

  const openExternally = useCallback(async () => {
    if (!lease || !file) return;
    try {
      if (shouldRefreshLease(lease, Date.now())) {
        hasRetriedRef.current = false;
        await acquireUrl();
        return;
      }
      await Linking.openURL(lease.url);
    } catch {
      refreshAfterFailure();
    }
  }, [acquireUrl, file, lease, refreshAfterFailure]);

  const sourceUrl = lease?.url;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={clearAndClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>{file?.name ?? "Submitted file"}</Text>
            <Text style={styles.subtitle}>Review preview</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close file preview" onPress={clearAndClose} style={styles.closeButton}>
            <MFIcon name="x" size={22} color={colors.text} />
          </Pressable>
        </View>

        {status === "loading" ? <Text style={styles.status}>Loading secure preview…</Text> : null}
        {status === "denied" ? <Text style={styles.error}>Access denied. This file can no longer be opened.</Text> : null}
        {status === "unavailable" ? <Text style={styles.error}>This submitted file is no longer available.</Text> : null}
        {status === "error" ? (
          <View style={styles.errorGroup}>
            <Text style={styles.error}>The preview could not be loaded.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Retry file preview" onPress={retry} style={styles.actionButton}>
              <Text style={styles.actionText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {status === "ready" && sourceUrl && file?.previewKind === "image" ? (
          <Image source={{ uri: sourceUrl }} contentFit="contain" style={styles.preview} onError={refreshAfterFailure} accessibilityLabel={`Preview of ${file.name}`} />
        ) : null}
        {status === "ready" && sourceUrl && file?.previewKind === "pdf" ? (
          <WebView key={sourceUrl} source={{ uri: sourceUrl }} style={styles.preview} onError={refreshAfterFailure} onHttpError={refreshAfterFailure} />
        ) : null}
        {status === "ready" && sourceUrl && file?.previewKind === "external" ? (
          <View style={styles.external}>
            <MFIcon name="external-link" size={42} color={colors.primary} />
            <Text style={styles.externalTitle}>Open this file externally</Text>
            <Text style={styles.externalText}>This file type is not previewed inside MangaFlow.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Open ${file.name} externally`} onPress={openExternally} style={styles.actionButton}>
              <Text style={styles.actionText}>Open file</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#121017", paddingTop: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md, backgroundColor: colors.surface },
  titleBlock: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontWeight: "900", fontSize: 16 },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceContainer },
  preview: { flex: 1, width: "100%" },
  status: { color: colors.surface, textAlign: "center", marginTop: spacing.xl, fontSize: 14 },
  errorGroup: { alignItems: "center", gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.xl },
  error: { color: "#fecdd3", textAlign: "center", marginHorizontal: spacing.lg, marginTop: spacing.xl, fontSize: 14, lineHeight: 21 },
  external: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  externalTitle: { color: colors.surface, fontSize: 18, fontWeight: "900", textAlign: "center" },
  externalText: { color: "#d4ccd8", fontSize: 14, lineHeight: 21, textAlign: "center" },
  actionButton: { minHeight: 46, paddingHorizontal: spacing.lg, borderRadius: radius.full, justifyContent: "center", backgroundColor: colors.primary },
  actionText: { color: colors.surface, fontSize: 14, fontWeight: "900" },
});
