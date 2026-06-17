import { Text, View } from "react-native";
import { Badge, Card, Screen } from "../../components/Primitives";
import { canApprovePublication } from "../../utils/readiness";
import { publicationReadiness } from "../../data/seedData";
import { appStyles as styles } from "../../styles/appStyles";
import { colors } from "../../theme";
import type { OnAction } from "../../utils/screenUtils";

export function EditorPublication({ onAction }: { onAction: OnAction }) {
  const ready = canApprovePublication(publicationReadiness);

  return (
    <Screen title="Publication" subtitle="Readiness checklist">
      <Card style={{ backgroundColor: colors.bgPanel }}>
        <Text style={styles.cardTitle}>Paper Moon Arcade · Chapter 7</Text>
        <Text style={styles.bodyText}>
          Approval is blocked until every required production item is complete.
        </Text>
      </Card>
      {publicationReadiness.map((item) => (
        <Card key={item.label}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Badge
              label={item.complete ? "Complete" : "Blocked"}
              tone={item.complete ? "success" : "danger"}
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
