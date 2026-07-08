import { createFileRoute } from "@tanstack/react-router";
import { RankingsPage } from "@/features/series/rankings";

export const Route = createFileRoute("/app/rankings")({
  head: () => ({
    meta: [
      { title: "Bảng xếp hạng & Đánh giá — MangaFlow" },
      {
        name: "description",
        content: "Xem điểm số, lượt vote và chỉ số rủi ro của tác phẩm từ độc giả.",
      },
    ],
  }),
  component: RankingsPage,
});
