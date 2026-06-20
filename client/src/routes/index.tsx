import { createFileRoute } from "@tanstack/react-router";
import { LandingView } from "@/features/landing/components/LandingView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "beachRead — Read manga online" },
      {
        name: "description",
        content: "Discover trending manga, read latest chapters, and follow news on beachRead.",
      },
      { property: "og:title", content: "beachRead — Read manga online" },
      { property: "og:description", content: "Bringing the best of manga to readers worldwide." },
    ],
  }),
  component: LandingView,
});
