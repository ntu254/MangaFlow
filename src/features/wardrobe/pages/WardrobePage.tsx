import {
  WardrobeEditModal,
  WardrobeEmptyState,
  WardrobeUploadModal,
  FilterBar,
  UnderusedSection,
  WardrobeGrid,
  ItemDetail,
} from "@/features/wardrobe/components";
import {
  defaultWardrobeFilters,
  useWardrobeFilters,
} from "@/features/wardrobe/hooks/useWardrobeFilters";
import type { WardrobeOverview } from "@/features/wardrobe/services/wardrobe.service";
import { wardrobeService } from "@/features/wardrobe/services/wardrobe.service";
import type { ActiveFilters, WardrobeItem } from "@/features/wardrobe/types";
import { Navbar } from "@/shared/layout";
import { Button } from "@/shared/ui";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const WardrobePage = () => {
  const [filters, setFilters] = useState<ActiveFilters>(defaultWardrobeFilters);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [summary, setSummary] = useState<WardrobeOverview>({
    itemCount: 0,
    savedOutfits: 0,
    aiSuggestions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Edit state
  const [editItem, setEditItem] = useState<WardrobeItem | null>(null);

  // Detail panel state
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const cancelledRef = useRef(false);

  const loadWardrobe = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [itemsData, summaryData] = await Promise.all([
        wardrobeService.listItems(),
        wardrobeService.getOverview(),
      ]);
      if (cancelledRef.current) return;
      setItems(itemsData);
      setSummary(summaryData);
    } catch (error) {
      if (cancelledRef.current) return;
      const message =
        error instanceof Error ? error.message : "Không thể tải dữ liệu tủ đồ.";
      setLoadError(message);
    } finally {
      if (!cancelledRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    void loadWardrobe();
    return () => {
      cancelledRef.current = true;
    };
  }, [loadWardrobe]);

  const filtered = useWardrobeFilters({ items, filters, search });

  const handleSelectItem = (item: WardrobeItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setTimeout(() => setSelectedItem(null), 300);
  };

  const handleEdit = useCallback((item: WardrobeItem) => {
    setEditItem(item);
  }, []);

  const handleEditSave = useCallback(async (updated: WardrobeItem) => {
    try {
      await wardrobeService.updateItem(updated.id, {
        name: updated.name,
        category: updated.category,
        color: updated.color,
        tags: updated.tags,
        season: updated.season,
      });
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      
      // Update selected item in detail view
      if (selectedItem?.id === updated.id) {
        setSelectedItem(updated);
      }
    } catch {
      // fallback: update locally anyway
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      if (selectedItem?.id === updated.id) {
        setSelectedItem(updated);
      }
    }
  }, [selectedItem]);

  const handleDelete = useCallback(async (item: WardrobeItem) => {
    try {
      await wardrobeService.deleteItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setSummary((prev) => ({ ...prev, itemCount: prev.itemCount - 1 }));
      if (selectedItem?.id === item.id) {
        handleCloseDetail();
      }
    } catch {
      // fallback
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setSummary((prev) => ({ ...prev, itemCount: prev.itemCount - 1 }));
      if (selectedItem?.id === item.id) {
        handleCloseDetail();
      }
    }
  }, [selectedItem]);

  const handleResetFilters = () => {
    setFilters(defaultWardrobeFilters);
    setSearch("");
  };

  // Mock underused items (e.g. taking some items without "ai-scan" or oldest)
  const underusedItems = items.slice(0, Math.min(items.length, 5));

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background">
        <div 
          className="absolute inset-0 z-0 opacity-60 pointer-events-none"
          style={{ backgroundImage: "url('/fashion_background_theme.svg')", backgroundSize: "100% 100%", backgroundPosition: "center", backgroundRepeat: "no-repeat", filter: "blur(0.5px)" }}
        />
        <Navbar />
          <div className="container mx-auto max-w-7xl px-6 py-20 relative z-10">
            <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground">
              Đang tải dữ liệu tủ đồ...
            </div>
          </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background">
        <div 
          className="absolute inset-0 z-0 opacity-60 pointer-events-none"
          style={{ backgroundImage: "url('/fashion_background_theme.svg')", backgroundSize: "100% 100%", backgroundPosition: "center", backgroundRepeat: "no-repeat", filter: "blur(0.5px)" }}
        />
        <Navbar />
          <div className="container mx-auto max-w-7xl px-6 py-20 relative z-10">
            <div className="rounded-xl bg-destructive/5 p-8 text-center text-sm text-destructive">
              {loadError}
            </div>
          </div>
      </div>
    );
  }

  const isEmpty = items.length === 0;
  const isFilteredEmpty = !isEmpty && filtered.length === 0;

  return (
    <div className={`min-h-screen relative overflow-hidden bg-background transition-all duration-300 ${detailOpen ? "lg:pr-[380px]" : ""}`}>
      <div 
        className="absolute inset-0 z-0 opacity-60 pointer-events-none"
        style={{ backgroundImage: "url('/fashion_background_theme.svg')", backgroundSize: "100% 100%", backgroundPosition: "center", backgroundRepeat: "no-repeat", filter: "blur(0.5px)" }}
      />
      <Navbar />

      <div className="pt-24 pb-16 relative z-10">
        <div className="px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-medium text-foreground mb-1.5">
                  Tủ đồ của bạn
                </h1>
                <p className="text-sm text-muted-foreground font-body mb-3">
                  Số hóa, sắp xếp và phối lại những món bạn đang có.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/80 rounded-full text-xs font-body font-medium text-foreground border border-border/60 shadow-sm">
                  <span>{summary.itemCount} món đồ</span>
                  <span className="text-muted-foreground/35">·</span>
                  <span>{underusedItems.length} món lâu chưa mặc</span>
                  <span className="text-muted-foreground/35">·</span>
                  <span>{summary.aiSuggestions} gợi ý AI</span>
                </div>
              </div>

              {!isEmpty && (
                <Button
                  variant="accent"
                  onClick={() => setUploadOpen(true)}
                  className="gap-1.5 bg-accent hover:bg-accent/90 text-white rounded-full px-5 py-2 h-10 shrink-0 font-medium transition-all shadow-[0_18px_34px_-18px_hsl(var(--accent)/0.62)] hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm món đồ</span>
                </Button>
              )}
            </div>

            {isEmpty ? (
              <WardrobeEmptyState />
            ) : (
              <>
                <FilterBar
                  filters={filters}
                  search={search}
                  onFilterChange={setFilters}
                  onSearchChange={setSearch}
                  onReset={handleResetFilters}
                  totalItems={items.length}
                  filteredCount={filtered.length}
                />

                <UnderusedSection
                  items={underusedItems}
                  onSelectItem={handleSelectItem}
                />

                {isFilteredEmpty ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center py-16"
                  >
                    <p className="text-sm text-muted-foreground font-body">
                      Không tìm thấy món đồ nào phù hợp
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="text-sm text-accent font-body font-medium mt-2 hover:underline"
                    >
                      Xóa bộ lọc
                    </button>
                  </motion.div>
                ) : (
                  <div className="mt-6">
                    <WardrobeGrid
                      items={filtered}
                      onSelectItem={handleSelectItem}
                    />
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modals & Slide-overs */}
      <WardrobeUploadModal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          void loadWardrobe();
        }}
      />

      <WardrobeEditModal
        item={editItem}
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={handleEditSave}
      />

      <ItemDetail
        item={selectedItem}
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default WardrobePage;
