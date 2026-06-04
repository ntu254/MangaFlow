import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash } from "lucide-react";
import type { Annotation } from "@/features/annotation/api/annotation";
import { CommentPanel } from "@/features/comment/components/CommentPanel";

export type CommentsTabContentProps = {
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  selectedAnnotationId: string | null;
  setSelectedAnnotationId: (id: string | null) => void;
  handleUpdateAnnotationStatus: (annotationId: string, status: "OPEN" | "RESOLVED") => Promise<void>;
  setConfirmDelete: (confirm: { type: "annotation"; id: string } | null) => void;
  pageId: string | undefined;
  currentUser: { id: string; systemRole: string } | null;
};

export function CommentsTabContent({
  annotations,
  selectedAnnotation,
  selectedAnnotationId,
  setSelectedAnnotationId,
  handleUpdateAnnotationStatus,
  setConfirmDelete,
  pageId,
  currentUser
}: CommentsTabContentProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#2f243a]">Review Annotations</h2>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{annotations.length}</Badge>
        </div>

        {annotations.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-xs text-muted-foreground text-center">
            No annotations yet.
          </p>
        ) : (
          <div className="grid gap-2">
            {annotations.map((annotation) => {
              const isSelected = selectedAnnotation?.id === annotation.id;
              return (
                <div
                  key={annotation.id}
                  className={`rounded-lg border p-2.5 transition-colors ${
                    isSelected ? "border-[#ff7196] bg-[#fff3f8]/50" : "bg-white"
                  }`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left focus:outline-none"
                    onClick={() => setSelectedAnnotationId(annotation.id)}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#2f243a]">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: annotation.status === "RESOLVED" ? "#8a7a99" : "#ff7196" }}
                        aria-hidden="true"
                      />
                      Annotation
                    </span>
                    <Badge variant={annotation.status === "RESOLVED" ? "secondary" : "outline"} className="text-[9px] px-1.5 py-0 h-4">
                      {annotation.status}
                    </Badge>
                  </button>
                  <p className="mt-1.5 text-xs text-[#5f5270] leading-normal">
                    {annotation.comment || "No comment description"}
                  </p>
                  {annotation.regionId ? (
                    <p className="mt-1 text-[9px] text-muted-foreground">Linked region: {annotation.regionId.slice(-4)}</p>
                  ) : null}
                  <div className="mt-1.5 font-mono text-[9px] text-muted-foreground">
                    {Math.round(annotation.x * 1000)}, {Math.round(annotation.y * 1000)} &middot; {Math.round(annotation.width * 1000)} &times; {Math.round(annotation.height * 1000)}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      className="h-6 text-[10px] py-0"
                      onClick={() =>
                        void handleUpdateAnnotationStatus(
                          annotation.id,
                          annotation.status === "RESOLVED" ? "OPEN" : "RESOLVED"
                        )
                      }
                    >
                      {annotation.status === "RESOLVED" ? "Reopen" : "Resolve"}
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      className="h-6 text-[10px] py-0"
                      onClick={() => setConfirmDelete({ type: "annotation", id: annotation.id })}
                    >
                      <Trash className="size-2.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm">
        <Tabs defaultValue="page" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3 bg-[#f1ebf8]">
            <TabsTrigger value="page" className="text-xs py-1 h-7">Page</TabsTrigger>
            <TabsTrigger value="annotation" disabled={!selectedAnnotationId} className="text-xs py-1 h-7">
              Annotation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="page" className="outline-none m-0">
            {pageId && (
              <CommentPanel
                targetType="PAGE"
                targetId={pageId}
                pageId={pageId}
                currentUser={currentUser}
              />
            )}
          </TabsContent>

          <TabsContent value="annotation" className="outline-none m-0">
            {pageId && selectedAnnotationId ? (
              <CommentPanel
                targetType="PAGE"
                targetId={pageId}
                pageId={pageId}
                annotationId={selectedAnnotationId}
                currentUser={currentUser}
              />
            ) : (
              <p className="text-[11px] text-muted-foreground text-center py-4">
                Select an annotation on the page to view/post comments.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
