import { ActivityIndicator, RefreshControl, View } from "react-native";
import { MetricCard, Screen } from "../../components/Primitives";
import { useApi } from "../../utils/useApi";
import { mobileEndpoints } from "../../api/mobileApi";
import { colors } from "../../theme";
import { appStyles as styles } from "../../styles/appStyles";

export function BoardHome({ token, unreadCount }: { token: string; unreadCount: number }) {
  const { data, loading, refetch } = useApi<any>(mobileEndpoints.dashboard("BOARD"), token);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  const stats = data?.boardQueue || { pendingVotes: 0, atRiskReviews: 0 };

  return (
    <Screen title="Board Home" subtitle="Editorial Board" unreadCount={unreadCount}>
      <RefreshControl refreshing={loading} onRefresh={refetch} />
      <View style={styles.metricGrid}>
        <MetricCard label="Pending Approvals" value={stats.pendingVotes} />
        <MetricCard label="At-Risk Series" value={stats.atRiskReviews} color={colors.rosePink} />
      </View>
    </Screen>
  );
}
