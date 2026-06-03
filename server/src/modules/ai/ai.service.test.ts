import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createAiService, AiServiceError } from "./ai.service.js";

describe("AiService unit tests", () => {
  const baseUrl = "http://mock-ai-service:8000";
  const service = createAiService(baseUrl);

  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns true on checkHealth if service returns ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" })
    } as Response);

    const healthy = await service.checkHealth();
    expect(healthy).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/health`);
  });

  it("returns false on checkHealth if service returns not ok or error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false
    } as Response);

    const healthy = await service.checkHealth();
    expect(healthy).toBe(false);
  });

  it("detects bubbles successfully and returns bubbles metadata", async () => {
    const bubblesMock = [
      { id: 1, bbox: { x: 10, y: 20, width: 100, height: 50 }, confidence: 0.95 }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bubble_count: 1, bubbles: bubblesMock })
    } as Response);

    const buffer = Buffer.from("mock image data");
    const result = await service.detectBubbles(buffer);

    expect(result).toEqual(bubblesMock);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws AiServiceError on detectBubbles if HTTP returns error status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad request details"
    } as Response);

    const buffer = Buffer.from("mock image data");
    await expect(service.detectBubbles(buffer)).rejects.toThrow(AiServiceError);
  });

  it("processes bubbles successfully and returns full whitening metadata", async () => {
    const processMock = {
      image_mime_type: "image/png",
      image_base64: "base64_data",
      bubble_count: 1,
      bubbles: [
        { id: 1, bbox: { x: 5, y: 15, width: 80, height: 40 }, confidence: 0.88 }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => processMock
    } as Response);

    const buffer = Buffer.from("mock image data");
    const result = await service.processBubbles(buffer);

    expect(result).toEqual(processMock);
  });
});
