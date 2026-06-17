import { ActivityIndicator, RefreshControl, Text } from "react-native";
import { Screen } from "../../components/Primitives";
import { SeriesCard } from "../../components/cards/SeriesCard";
import { useApi } from "../../utils/useApi";
import { mobileEndpoints } from "../../api/mobileApi";
import { appStyles as styles } from "../../styles/appStyles";

export function EditorSeries({ token }: { token: string }) {
  const { data: seriesList, loading, refetch } = useApi<any[]>(mobileEndpoints.editorSeries, token);

  return (
    <Screen title="Assigned Series" subtitle="Tantou Editor">
      <RefreshControl refreshing={loading} onRefresh={refetch} />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (seriesList || []).length === 0 ? (
        <Text style={styles.bodyText}>No assigned series found.</Text>
      ) : null}
      {(seriesList || []).map((series) => (
        <SeriesCard key={series._id} series={series} />
      ))}
    </Screen>
  );
}
