import { ActivityIndicator, RefreshControl, Text, View } from "react-native";
import { MetricCard, Screen } from "../../components/Primitives";
import { useApi } from "../../utils/useApi";
import { mobileEndpoints } from "../../api/mobileApi";
import { colors } from "../../theme";
import { appStyles as styles } from "../../styles/appStyles";
import type { OnAction } from "../../utils/screenUtils";

export function EditorHome({
  token,
  unreadCount,
  onAction
}: {
  token: string;
  unreadCount: number;
  onAction: OnAction;
}) {
  const { data, loading, refetch } = useApi<any>(mobileEndpoints.dashboard("EDITOR"), token);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  const stats = data?.quickStats || { assignedSeries: 0, pendingApprovals: 0 };

  return (
    <Screen title="Editor Home" subtitle="Tantou Editor" unreadCount={unreadCount}>
      <RefreshControl refreshing={loading} onRefresh={refetch} />
      <View style={styles.metricGrid}>
        <MetricCard label="Assigned Series" value={stats.assignedSeries} />
        <MetricCard
          label="Manuscripts Waiting"
          value={data?.reviewQueue?.manuscripts || 0}
          color={colors.pinkPurple}
        />
        <MetricCard
          label="Pending Approvals"
          value={stats.pendingApprovals}
          color={colors.rosePink}
        />
      </View>
    </Screen>
  );
}
