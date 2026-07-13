import { createFileRoute } from "@tanstack/react-router";
import { EarningsPage } from "@/features/assistant/earnings";

export const Route = createFileRoute("/app/assistant/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings — beachRead Studio" },
      { name: "description", content: "Assistant earnings (read-only)." },
    ],
  }),
  component: EarningsPage,
});
