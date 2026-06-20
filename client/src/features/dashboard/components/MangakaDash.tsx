import { useRole } from "@/shared/lib/role";
import { currentUserByRole } from "@/entities";
import { MangakaHeader } from "./mangaka/MangakaHeader";
import { MySeriesCarousel } from "./mangaka/MySeriesCarousel";
import { ProductionOverview } from "./mangaka/ProductionOverview";
import { ReviewQueueList } from "./mangaka/ReviewQueueList";
import { RecentChaptersList } from "./mangaka/RecentChaptersList";
import { MangakaRightPanel } from "./mangaka/MangakaRightPanel";
import { useDashboard } from "@/shared/queries/useDashboard";

export function MangakaDash() {
  const { role } = useRole();
  const me = currentUserByRole[role];
  const { data: dashboardData } = useDashboard("mangaka");

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-8">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <MangakaHeader />
        <MySeriesCarousel mangakaId={me.id} />
        <ProductionOverview data={dashboardData} />

        <div className="flex flex-col xl:flex-row gap-6">
          <ReviewQueueList />
          <RecentChaptersList />
        </div>
      </div>

      {/* Right Sidebar Area */}
      <MangakaRightPanel data={dashboardData} />
    </div>
  );
}
