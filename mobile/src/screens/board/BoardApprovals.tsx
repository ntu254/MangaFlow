import { ActivityIndicator, RefreshControl, Text, View } from "react-native";
import { ActionButton, Badge, Card, Screen } from "../../components/Primitives";
import { useApi } from "../../utils/useApi";
import { mobileEndpoints } from "../../api/mobileApi";
import { appStyles as styles } from "../../styles/appStyles";
import type { OnAction } from "../../utils/screenUtils";

export function BoardApprovals({ token, onAction }: { token: string; onAction: OnAction }) {
  const { data: boardSeries, loading, refetch } = useApi<any[]>(
    mobileEndpoints.boardApprovals,
    token
  );

  return (
    <Screen title="Approvals" subtitle="Summary-based board review">
      <RefreshControl refreshing={loading} onRefresh={refetch} />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (boardSeries || []).length === 0 ? (
        <Text style={styles.bodyText}>No series pending board approval.</Text>
      ) : null}
      {(boardSeries || []).map((series) => (
        <Card key={series._id}>
          <View style={styles.rowBetween}>
            <View style={styles.stack}>
              <Text style={styles.cardTitle}>{series.title}</Text>
            </View>
            <Badge label={series.status} tone="warning" />
          </View>
          <Text style={styles.bodyText}>{series.synopsis}</Text>
          <View style={styles.actionRow}>
            <ActionButton
              label="Approve"
              onPress={() =>
                onAction(
                  "Submit vote",
                  `Vote APPROVE for ${series.title}. This will be recorded with your board identity.`,
                  "Submit vote",
                  "board-vote",
                  { seriesId: series._id, vote: "APPROVE" }
                )
              }
            />
            <ActionButton
              label="Needs Revision"
              onPress={() =>
                onAction(
                  "Submit vote",
                  `Vote NEEDS_REVISION for ${series.title}. Reason is required for this decision.`,
                  "Submit vote",
                  "board-vote",
                  { seriesId: series._id, vote: "NEEDS_REVISION" }
                )
              }
              variant="secondary"
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
