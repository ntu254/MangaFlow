import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ReviewFileViewer } from "@/components/review-file-viewer";
import { MFIcon } from "@/design/icons";
import { colors, radius, spacing } from "@/design/tokens";
import { cleanFileName, type ReviewFile } from "@/domain/review-files";

export function SubmittedFilesPanel({
  files,
  title = "Submitted files",
  loading = false,
  errorText,
}: {
  files: ReviewFile[];
  title?: string;
  loading?: boolean;
  errorText?: string | null;
}) {
  const [selectedFile, setSelectedFile] = useState<ReviewFile | null>(null);

  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {loading ? (
        <Text style={styles.empty}>Loading submitted files…</Text>
      ) : errorText ? (
        <Text style={styles.empty}>{errorText}</Text>
      ) : files.length === 0 ? (
        <Text style={styles.empty}>No submitted files are available for this review.</Text>
      ) : (
        <View style={styles.list}>
          {files.map((file) => (
            <Pressable
              key={file.id}
              accessibilityRole="button"
              accessibilityLabel={`Open submitted file ${file.name}`}
              onPress={() => setSelectedFile(file)}
              style={styles.fileRow}
            >
              <View style={styles.fileIcon}>
                <MFIcon name={file.previewKind === "image" ? "eye" : "file-text"} size={19} color={colors.primary} />
              </View>
              <View style={styles.fileBody}>
                <Text style={styles.fileName} numberOfLines={1}>{cleanFileName(file.name)}</Text>
                <Text style={styles.metadata} numberOfLines={1}>
                  {file.submittedBy ? `Submitted by ${file.submittedBy}` : "Submitted file"}
                  {file.submittedAt ? ` · ${formatSubmittedAt(file.submittedAt)}` : ""}
                </Text>
              </View>
              <MFIcon name="chevron-right" size={18} color={colors.outline} />
            </Pressable>
          ))}
        </View>
      )}
      <ReviewFileViewer
        file={selectedFile}
        visible={selectedFile !== null}
        onClose={() => setSelectedFile(null)}
      />
    </View>
  );
}

function formatSubmittedAt(submittedAt: string): string {
  const date = new Date(submittedAt);
  return Number.isNaN(date.getTime()) ? submittedAt : date.toLocaleString();
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  title: { color: colors.text, fontSize: 17, fontWeight: "900" },
  empty: { color: colors.textMuted, fontSize: 13, lineHeight: 20, paddingVertical: spacing.sm },
  list: { borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  fileRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 64, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  fileIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  fileBody: { flex: 1, minWidth: 0 },
  fileName: { color: colors.text, fontSize: 14, fontWeight: "800" },
  metadata: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
});
