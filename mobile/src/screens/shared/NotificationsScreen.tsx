import { ActivityIndicator, RefreshControl, Text } from "react-native";
import { Badge, Card, Screen } from "../../components/Primitives";
import { useApi } from "../../utils/useApi";
import { mobileEndpoints } from "../../api/mobileApi";
import { appStyles as styles } from "../../styles/appStyles";

export function NotificationsScreen({ token }: { token: string }) {
  const { data, loading, refetch } = useApi<any>(mobileEndpoints.notifications, token);
  const notifications = data?.notifications || [];

  return (
    <Screen title="Notifications" subtitle="Priority alerts">
      <RefreshControl refreshing={loading} onRefresh={refetch} />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : notifications.length === 0 ? (
        <Text style={styles.bodyText}>No notifications.</Text>
      ) : null}
      {notifications.map((notification: any) => (
        <Card key={notification._id}>
          <Text style={styles.cardTitle}>{notification.title}</Text>
          <Badge
            label={notification.status === "UNREAD" ? "Unread" : "Read"}
            tone={notification.status === "UNREAD" ? "danger" : "default"}
          />
          <Text style={styles.bodyText}>{notification.body}</Text>
        </Card>
      ))}
    </Screen>
  );
}
