import { Navbar } from "@/shared/layout";
import { Button } from "@/shared/ui";
import { aiOutfitsService } from "@/features/wardrobe/services/ai-outfits.service";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type SavedAiOutfitItem = {
  outfit_id: string;
  name: string;
  image_url: string | null;
  price: number | null;
  brand: string | null;
  affiliate_url: string | null;
  slot: string | null;
  created_at: string;
};

type SavedAiOutfit = {
  id: string;
  user_id: string;
  style: string | null;
  prompt: string | null;
  image_url: string | null;
  is_saved: boolean;
  is_generated: boolean;
  created_at: string;
};

export default function SavedAiOutfitsPage() {
  const [outfits, setOutfits] = useState<SavedAiOutfit[]>([]);
  const [items, setItems] = useState<Record<string, SavedAiOutfitItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const favorites = useMemo(() => outfits.filter((o) => o.style), [outfits]);

  useEffect(() => {
    let cancelled = false;

    const loadSavedOutfits = async () => {
      try {
        setLoading(true);
        const list = await aiOutfitsService.listSaved();

        const entries = await Promise.all(
          list.map(async (outfit) => {
            const outfitItems = await aiOutfitsService.listItems(outfit.id);
            return [outfit.id, outfitItems] as const;
          })
        );

        if (!cancelled) {
          setOutfits(list);
          setItems(Object.fromEntries(entries));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSavedOutfits();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (outfitId: string) => {
    setRemovingId(outfitId);

    await aiOutfitsService.deleteSaved(outfitId);
    setOutfits((prev) => prev.filter((item) => item.id !== outfitId));

    setItems((prev) => {
      const next = { ...prev };
      delete next[outfitId];
      return next;
    });

    setRemovingId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Bộ sưu tập AI đã lưu
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Bộ sưu tập cá nhân của bạn
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          {loading && (
            <p className="text-sm text-muted-foreground">
              Đang tải bộ sưu tập...
            </p>
          )}

          {!loading && favorites.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Chưa có outfit AI nào được lưu.
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {favorites.map((outfit) => (
              <div
                key={outfit.id}
                className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm"
              >
                <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-secondary sm:aspect-auto sm:h-40">
                  {outfit.image_url ? (
                    <img
                      src={outfit.image_url}
                      alt={outfit.style ?? "outfit"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <p className="p-2 text-xs text-muted-foreground">
                      AI Preview
                    </p>
                  )}
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {outfit.style ?? "Outfit AI"}
                      </p>
                      <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                        {outfit.prompt}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(outfit.id)}
                        aria-label="Xóa"
                        disabled={removingId === outfit.id}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(items[outfit.id] ?? []).map((item, idx) => (
                      <span
                        key={item.outfit_id + item.name + idx}
                        className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
