import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { MFIcon } from "@/design/icons";
import { colors, radius, spacing } from "@/design/tokens";
import { REFRESH_SKEW_MS, shouldRefreshLease, type FileUrlLease, type ReviewFile } from "@/domain/review-files";
import { pdfPreviewHtml } from "@/components/pdf-preview-html";
import { openReviewFile } from "@/services/mobile-file-review";
import { MobileApiError } from "@/services/mobile-api-error";

function externalReasonText(file: ReviewFile | null): string {
  if (file?.mimeType.trim().toLowerCase() === "application/pdf") {
    return "PDF preview is unavailable in this build. Open it in your device PDF reader instead.";
  }
  return "This file type is not previewed inside MangaFlow.";
}

type ViewerStatus = "loading" | "ready" | "unavailable" | "denied" | "error";

export function ReviewFileViewer({
  file,
  visible,
  onClose,
}: {
  file: ReviewFile | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [lease, setLease] = useState<FileUrlLease | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const hasRetriedRef = useRef(false);
  const requestVersionRef = useRef(0);

  const clearAndClose = useCallback(() => {
    requestVersionRef.current += 1;
    setLease(null);
    onClose();
  }, [onClose]);

  const acquireUrl = useCallback(async (): Promise<FileUrlLease | null> => {
    if (!file) return null;
    const requestVersion = ++requestVersionRef.current;
    setStatus("loading");
    try {
      const nextLease = await openReviewFile(file);
      if (requestVersion !== requestVersionRef.current) return null;
      setLease(nextLease);
      setStatus("ready");
      return nextLease;
    } catch (error) {
      if (requestVersion !== requestVersionRef.current) return null;
      if (error instanceof MobileApiError && error.status === 403) {
        clearAndClose();
        return null;
      }
      setStatus(error instanceof MobileApiError && error.status === 404 ? "unavailable" : "error");
      return null;
    }
  }, [clearAndClose, file]);

  useEffect(() => {
    if (!visible || !file) {
      requestVersionRef.current += 1;
      setLease(null);
      return;
    }
    hasRetriedRef.current = false;
    setLease(null);
    void acquireUrl();
    return () => {
      requestVersionRef.current += 1;
    };
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

  // Silently renew the lease before its 900-second server lifetime expires,
  // instead of waiting for an image/PDF load failure to notice. The current
  // preview stays on screen; a failed silent renewal is left for the next
  // explicit retry or onError recovery rather than surfacing here.
  const refreshLeaseQuietly = useCallback(async () => {
    if (!file) return;
    const requestVersion = requestVersionRef.current;
    try {
      const nextLease = await openReviewFile(file);
      if (requestVersion !== requestVersionRef.current) return;
      setLease(nextLease);
    } catch {
      // Ignored — see comment above.
    }
  }, [file]);

  useEffect(() => {
    if (!visible || !lease) return;
    const delayMs = Math.max(0, lease.expiresAtMs - REFRESH_SKEW_MS - Date.now());
    const timer = setTimeout(() => void refreshLeaseQuietly(), delayMs);
    return () => clearTimeout(timer);
  }, [lease, refreshLeaseQuietly, visible]);

  const retry = useCallback(() => {
    hasRetriedRef.current = false;
    setLease(null);
    void acquireUrl();
  }, [acquireUrl]);

  const openExternally = useCallback(async () => {
    if (!lease || !file) return;
    try {
      let activeLease = lease;
      if (shouldRefreshLease(lease, Date.now())) {
        hasRetriedRef.current = false;
        const refreshedLease = await acquireUrl();
        if (!refreshedLease) return;
        activeLease = refreshedLease;
      }
      await Linking.openURL(activeLease.url);
    } catch {
      refreshAfterFailure();
    }
  }, [acquireUrl, file, lease, refreshAfterFailure]);

  const sourceUrl = lease?.url;
  const pdfSource = sourceUrl && Platform.OS === "android"
    ? { html: pdfPreviewHtml(sourceUrl) }
    : sourceUrl
      ? { uri: sourceUrl }
      : undefined;
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
          <WebView
            key={sourceUrl}
            testID="pdf-file-preview"
            source={pdfSource}
            style={styles.preview}
            originWhitelist={["*"]}
            cacheEnabled={false}
            incognito
            onError={refreshAfterFailure}
            onHttpError={refreshAfterFailure}
            onMessage={(event) => {
              if (event.nativeEvent.data === "pdf-preview-error") refreshAfterFailure();
            }}
          />
        ) : null}
        {status === "ready" && sourceUrl && file?.previewKind === "external" ? (
          <View style={styles.external}>
            <MFIcon name="external-link" size={42} color={colors.primary} />
            <Text style={styles.externalTitle}>Open this file externally</Text>
            <Text style={styles.externalText}>{externalReasonText(file)}</Text>
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
