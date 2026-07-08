import { supabase } from "@/shared/lib/supabase";

export interface InboxNotification {
  id: string;           // notification_inbox.id
  notification_id: string;
  user_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  // Joined from notifications
  title: string;
  body: string;
  type: string;
  action_url: string | null;
  image_url: string | null;
}

export const notificationsService = {
  /**
   * Lấy danh sách inbox notifications của user (join với bảng notifications).
   */
  getInbox: async (userId: string, limit = 20): Promise<InboxNotification[]> => {
    const { data, error } = await supabase
      .from("notification_inbox")
      .select(`
        id,
        notification_id,
        user_id,
        is_read,
        read_at,
        created_at,
        notifications (
          title,
          body,
          type,
          action_url,
          image_url
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (
        error.message.includes("schema cache") ||
        error.message.includes("permission denied") ||
        error.code === "PGRST204" ||
        error.code === "PGRST116" ||
        error.code === "42P01" ||
        error.code === "42501" ||
        error.code === "PGRST301"
      ) {
        return [];
      }
      throw error;
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      notification_id: row.notification_id,
      user_id: row.user_id,
      is_read: row.is_read,
      read_at: row.read_at,
      created_at: row.created_at,
      title: row.notifications?.title ?? "",
      body: row.notifications?.body ?? "",
      type: row.notifications?.type ?? "system",
      action_url: row.notifications?.action_url ?? null,
      image_url: row.notifications?.image_url ?? null,
    }));
  },

  /**
   * Đếm số thông báo chưa đọc.
   */
  getUnreadCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from("notification_inbox")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      if (
        error.message.includes("schema cache") ||
        error.message.includes("permission denied") ||
        error.code === "PGRST204" ||
        error.code === "PGRST116" ||
        error.code === "42P01" ||
        error.code === "42501" ||
        error.code === "PGRST301"
      ) {
        return 0;
      }
      throw error;
    }
    return count ?? 0;
  },

  /**
   * Đánh dấu một thông báo đã đọc và ghi log vào notification_logs.
   */
  markAsRead: async (inboxId: string, userId: string, notificationId: string): Promise<void> => {
    const now = new Date().toISOString();

    await supabase
      .from("notification_inbox")
      .update({ is_read: true, read_at: now })
      .eq("id", inboxId)
      .eq("user_id", userId);

    // Ghi clicked log vào notification_logs
    await supabase
      .from("notification_logs")
      .upsert(
        {
          notification_id: notificationId,
          user_id: userId,
          channel: "in_app",
          status: "clicked",
          clicked_at: now,
        },
        { onConflict: "notification_id,user_id" }
      );
  },

  /**
   * Đánh dấu tất cả thông báo đã đọc.
   */
  markAllAsRead: async (userId: string): Promise<void> => {
    const now = new Date().toISOString();
    await supabase
      .from("notification_inbox")
      .update({ is_read: true, read_at: now })
      .eq("user_id", userId)
      .eq("is_read", false);
  },
};
