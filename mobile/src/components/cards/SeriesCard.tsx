import { Text, View } from "react-native";
import { Badge, Card } from "../Primitives";
import { statusTone } from "../../utils/screenUtils";
import { appStyles as styles } from "../../styles/appStyles";

export function SeriesCard({ series }: { series: any }) {
  return (
    <Card>
      <View style={styles.rowBetween}>
        <View style={styles.stack}>
          <Text style={styles.cardTitle}>{series.title}</Text>
          <Text style={styles.metaText}>{series.synopsis?.substring(0, 50)}...</Text>
        </View>
        <Badge label={series.status} tone={statusTone(series.status)} />
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: "50%" }]} />
      </View>
      <View style={styles.inlineMeta}>
        <Text style={styles.metaText}>Author {series.authorId?.substring(0, 6)}</Text>
      </View>
    </Card>
  );
}
