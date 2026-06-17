import { ActivityIndicator, RefreshControl, Text } from "react-native";
import { Screen } from "../../components/Primitives";
import { ReviewCard, CommentQueue } from "../../components/cards/ReviewCards";
import { useApi } from "../../utils/useApi";
import { mobileEndpoints } from "../../api/mobileApi";
import { appStyles as styles } from "../../styles/appStyles";
import type { OnAction } from "../../utils/screenUtils";

export function EditorReviews({ token, onAction }: { token: string; onAction: OnAction }) {
  const { data: reviews, loading: reviewsLoading, refetch: refetchReviews } = useApi<any[]>(
    mobileEndpoints.reviewQueue,
    token
  );
  const { data: comments, loading: commentsLoading, refetch: refetchComments } = useApi<any[]>(
    "/comments",
    token
  );

  return (
    <Screen title="Review Queue" subtitle="Manuscripts, pages, comments">
      <RefreshControl
        refreshing={reviewsLoading || commentsLoading}
        onRefresh={() => {
          refetchReviews();
          refetchComments();
        }}
      />
      {reviewsLoading ? <ActivityIndicator size="large" /> : null}
      {(reviews || []).map((review) => (
        <ReviewCard item={review} key={review._id} onAction={onAction} />
      ))}
      <Text style={styles.sectionTitle}>Comment Queue</Text>
      <CommentQueue comments={(comments as any)?.data || []} />
    </Screen>
  );
}
