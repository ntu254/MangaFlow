import { Text } from "react-native";
import { Card, Screen } from "../../components/Primitives";
import { appStyles as styles } from "../../styles/appStyles";
import { colors } from "../../theme";
import type { OnAction } from "../../utils/screenUtils";

export function BoardRanking({ onAction }: { onAction: OnAction }) {
  return (
    <Screen title="Ranking" subtitle="Period 2026-W23">
      <Card style={{ backgroundColor: colors.bgPanel }}>
        <Text style={styles.cardTitle}>Formula</Text>
        <Text style={styles.bodyText}>
          finalScore = voteCount × 0.7 + normalizedReaderScore × 0.3
        </Text>
      </Card>
      <Text style={styles.bodyText}>Ranking list is currently disabled in this preview.</Text>
    </Screen>
  );
}

export function BoardDecisions({ onAction }: { onAction: OnAction }) {
  return (
    <Screen title="Decisions" subtitle="Chair tie-break and history">
      <Card>
        <Text style={styles.cardTitle}>Recent decision</Text>
        <Text style={styles.bodyText}>
          Aurora Ink continued with a ranking warning and editor follow-up.
        </Text>
      </Card>
    </Screen>
  );
}
