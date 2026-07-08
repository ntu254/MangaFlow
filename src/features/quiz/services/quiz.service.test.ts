import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/config", () => ({
  apiConfig: {
    useMockApi: false,
    baseUrl: "",
    mockDelayMs: 0,
  },
}));

vi.mock("@/shared/lib", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { quizService } from "./quiz.service";

describe("quiz.service", () => {
  beforeEach(async () => {
    const { supabase } = await import("@/shared/lib");
    vi.clearAllMocks();
    supabase.from.mockReset();
  });

  it("persists selected gender in fashion preferences", async () => {
    const { supabase } = await import("@/shared/lib");
    const update = vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
    }));

    supabase.from.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { fashion_preferences: { existing: true } },
            error: null,
          }),
        }),
      }),
    });
    supabase.from.mockReturnValueOnce({
      update,
    });

    await quizService.completeQuiz("user-1", {
      gender: "male",
      styles: ["minimal"],
      occasions: ["work"],
      budget: "mid",
      colors: ["black"],
    });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      fashion_preferences: expect.objectContaining({
        existing: true,
        gender: "male",
      }),
      quiz_completed: true,
    }));
  });
});
