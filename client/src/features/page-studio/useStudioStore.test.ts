import { beforeEach, describe, expect, it } from "vitest";
import { useStudioStore } from "./useStudioStore";

describe("useStudioStore", () => {
  beforeEach(() => {
    useStudioStore.setState({
      workspacePageId: null,
      viewport: { x: 0, y: 0, scale: 1 },
      selectedRegionId: null,
      activeTool: "select",
      isPanning: false,
      isSpaceDown: false,
      containerSize: { w: 800, h: 600 },
      activeTab: "inspect",
      isInspectorCollapsed: false,
      isCarouselCollapsed: false,
      showRegions: true,
      showComments: true,
      compareOriginal: false,
      regionTasks: {},
    });
  });

  it("resets page-scoped workspace state when the page changes", () => {
    useStudioStore.setState({
      workspacePageId: "page-1",
      viewport: { x: 80, y: -40, scale: 2 },
      selectedRegionId: "region-1",
      activeTool: "rect",
      isPanning: true,
      isSpaceDown: true,
      containerSize: { w: 320, h: 240 },
      isInspectorCollapsed: true,
      isCarouselCollapsed: true,
      compareOriginal: true,
      regionTasks: {
        "region-1": {
          taskId: "task-1",
          taskType: "Tone",
          assigneeId: "user-1",
          priority: "high",
          dueDate: "Jun 22",
        },
      },
    });

    useStudioStore.getState().resetForPage("page-2");

    expect(useStudioStore.getState()).toMatchObject({
      workspacePageId: "page-2",
      viewport: { x: 0, y: 0, scale: 1 },
      selectedRegionId: null,
      activeTool: "select",
      isPanning: false,
      isSpaceDown: false,
      containerSize: { w: 800, h: 600 },
      isInspectorCollapsed: true,
      isCarouselCollapsed: true,
      compareOriginal: true,
      regionTasks: {},
    });
  });

  it("does not reset when the same page is reopened", () => {
    useStudioStore.setState({
      workspacePageId: "page-1",
      viewport: { x: 20, y: 10, scale: 1.5 },
      selectedRegionId: "region-1",
    });

    useStudioStore.getState().resetForPage("page-1");

    expect(useStudioStore.getState()).toMatchObject({
      workspacePageId: "page-1",
      viewport: { x: 20, y: 10, scale: 1.5 },
      selectedRegionId: "region-1",
    });
  });
});
