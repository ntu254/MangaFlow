import { Text, View } from "react-native";
import { ActionButton, Badge, Card } from "../Primitives";
import { statusTone, type OnAction } from "../../utils/screenUtils";
import { appStyles as styles } from "../../styles/appStyles";

export function ReviewCard({ item, onAction }: { item: any; onAction: OnAction }) {
  return (
    <Card>
      <View style={styles.rowBetween}>
        <View style={styles.stack}>
          <Text style={styles.cardTitle}>{item.taskType?.name || "Review"}</Text>
          <Text style={styles.metaText}>
            {item.reviewerNote || "No notes"} · {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Badge label={item.status} tone={statusTone(item.status)} />
      </View>
      <View style={styles.actionRow}>
        <ActionButton
          icon="checkmark-circle-outline"
          label="Approve"
          onPress={() =>
            onAction(
              "Approve review",
              "This submission will be marked as approved.",
              "Approve",
              "approve-submission",
              { submissionId: item._id }
            )
          }
        />
        <ActionButton
          label="Revision"
          onPress={() =>
            onAction(
              "Request revision",
              "This action will notify the assigned workflow users.",
              "Request revision",
              "reject-submission",
              { submissionId: item._id }
            )
          }
          variant="secondary"
        />
      </View>
    </Card>
  );
}

export function CommentQueue({ comments }: { comments: any[] }) {
  if (!comments || comments.length === 0)
    return <Text style={styles.bodyText}>No open comments.</Text>;
  return (
    <View style={styles.stack}>
      {comments.map((comment) => (
        <Card key={comment._id}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Comment</Text>
            <Badge label={comment.status} tone={statusTone(comment.status)} />
          </View>
          <Text style={styles.bodyText}>{comment.content}</Text>
        </Card>
      ))}
    </View>
  );
}
