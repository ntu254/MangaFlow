import { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar } from "react-native";
import { ConfirmationDialog } from "./src/components/Primitives";
import { BottomTabs, RoleSwitch } from "./src/components/navigation/Navigation";
import { EditorHome } from "./src/screens/editor/EditorHome";
import { EditorSeries } from "./src/screens/editor/EditorSeries";
import { EditorReviews } from "./src/screens/editor/EditorReviews";
import { EditorPublication } from "./src/screens/editor/EditorPublication";
import { BoardHome } from "./src/screens/board/BoardHome";
import { BoardApprovals } from "./src/screens/board/BoardApprovals";
import { BoardRanking, BoardDecisions } from "./src/screens/board/BoardOther";
import { NotificationsScreen } from "./src/screens/shared/NotificationsScreen";
import { mobileEndpoints, TEST_TOKENS, requestMangaFlow } from "./src/api/mobileApi";
import { useApi } from "./src/utils/useApi";
import { appStyles as styles } from "./src/styles/appStyles";
import { colors } from "./src/theme";
import type { BoardTab, EditorTab, MobileRole } from "./src/types";
import type { DialogPayload, OnAction } from "./src/utils/screenUtils";

export default function App() {
  const [role, setRoleState] = useState<MobileRole>("EDITOR");
  const [editorTab, setEditorTab] = useState<EditorTab>("Home");
  const [boardTab, setBoardTab] = useState<BoardTab>("Home");
  const [dialog, setDialog] = useState<DialogPayload | null>(null);

  const token = role === "EDITOR" ? TEST_TOKENS.EDITOR : TEST_TOKENS.BOARD;

  const { data: notifData } = useApi<any>(mobileEndpoints.notifications, token);
  const unreadCount = useMemo(() => {
    if (!notifData?.notifications) return 0;
    return notifData.notifications.filter((n: any) => n.status === "UNREAD").length;
  }, [notifData]);

  function setRole(nextRole: MobileRole) {
    setRoleState(nextRole);
    setEditorTab("Home");
    setBoardTab("Home");
  }

  const openDialog: OnAction = (title, message, confirmLabel, actionType, payload) => {
    setDialog({ title, message, confirmLabel, actionType, payload });
  };

  const handleConfirm = async () => {
    if (!dialog) return;
    try {
      if (dialog.actionType === "approve-submission") {
        await requestMangaFlow(mobileEndpoints.approveSubmission(dialog.payload.submissionId), {
          token,
          method: "POST"
        });
      } else if (dialog.actionType === "reject-submission") {
        await requestMangaFlow(mobileEndpoints.rejectSubmission(dialog.payload.submissionId), {
          token,
          method: "POST",
          body: { reviewerNote: "Rejected via mobile" }
        });
      } else if (dialog.actionType === "board-vote") {
        await requestMangaFlow(mobileEndpoints.vote(dialog.payload.seriesId), {
          token,
          method: "POST",
          body: { vote: dialog.payload.vote }
        });
      }
      setDialog(null);
      alert("Action completed successfully!");
    } catch (err) {
      alert("Error: " + String(err));
      setDialog(null);
    }
  };

  const currentTab = role === "EDITOR" ? editorTab : boardTab;

  const content =
    role === "EDITOR" ? (
      editorTab === "Home" ? (
        <EditorHome token={token} unreadCount={unreadCount} onAction={openDialog} />
      ) : editorTab === "Series" ? (
        <EditorSeries token={token} />
      ) : editorTab === "Reviews" ? (
        <EditorReviews token={token} onAction={openDialog} />
      ) : editorTab === "Publication" ? (
        <EditorPublication onAction={openDialog} />
      ) : (
        <NotificationsScreen token={token} />
      )
    ) : boardTab === "Home" ? (
      <BoardHome token={token} unreadCount={unreadCount} />
    ) : boardTab === "Approvals" ? (
      <BoardApprovals token={token} onAction={openDialog} />
    ) : boardTab === "Ranking" ? (
      <BoardRanking onAction={openDialog} />
    ) : boardTab === "Decisions" ? (
      <BoardDecisions onAction={openDialog} />
    ) : (
      <NotificationsScreen token={token} />
    );

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgMain} />
      <RoleSwitch role={role} setRole={setRole} />
      <ScrollView>{content}</ScrollView>
      <BottomTabs
        role={role}
        tab={currentTab}
        setTab={(nextTab) => {
          if (role === "EDITOR") setEditorTab(nextTab as EditorTab);
          else setBoardTab(nextTab as BoardTab);
        }}
      />
      <ConfirmationDialog
        confirmLabel={dialog?.confirmLabel ?? "Confirm"}
        message={dialog?.message ?? ""}
        onCancel={() => setDialog(null)}
        onConfirm={handleConfirm}
        title={dialog?.title ?? ""}
        visible={Boolean(dialog)}
      />
    </SafeAreaView>
  );
}
