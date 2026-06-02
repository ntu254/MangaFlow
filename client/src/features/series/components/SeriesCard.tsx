import { Link } from "react-router-dom";
import type { Series } from "../api/series";
import { Badge } from "@/components/ui/badge";

export function SeriesCard({ series }: { series: Series }) {
  return (
    <Link to={`/app/mangaka/series/${series.id}`} className="group block">
      <div className="border border-border rounded-xl p-4 transition-all hover:border-primary/50 hover:shadow-md bg-card">
        <div className="aspect-[3/4] w-full bg-muted rounded-md mb-4 overflow-hidden flex items-center justify-center relative">
          {series.coverUrl ? (
            <img src={series.coverUrl} alt={series.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-muted-foreground text-sm font-medium">No Cover</span>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant={series.status === "DRAFT" ? "secondary" : "default"}>
              {series.status}
            </Badge>
          </div>
        </div>
        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {series.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {series.description || "No description provided."}
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {series.genre.slice(0, 3).map((g) => (
            <Badge key={g} variant="outline" className="text-[10px] px-1.5 py-0">
              {g}
            </Badge>
          ))}
          {series.genre.length > 3 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{series.genre.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
