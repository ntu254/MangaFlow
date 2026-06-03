import { env } from "../../config/env.config.js";

export type YoloBubble = {
  id: number;
  bbox: { x: number; y: number; width: number; height: number };
  confidence: number;
  has_mask?: boolean;
};

export type YoloProcessResponse = {
  image_mime_type: string;
  image_base64: string;
  bubble_count: number;
  bubbles: YoloBubble[];
};

export class AiServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 500
  ) {
    super(message);
  }
}

export function createAiService(baseUrl = env.aiServiceUrl) {
  return {
    async checkHealth(): Promise<boolean> {
      try {
        const res = await fetch(`${baseUrl}/health`);
        if (!res.ok) return false;
        const data = await res.json() as any;
        return data.status === "ok";
      } catch (err) {
        console.error("AI Service health check failed:", err);
        return false;
      }
    },

    async detectBubbles(imageBuffer: Buffer, fileName = "page.jpg"): Promise<YoloBubble[]> {
      try {
        const formData = new FormData();
        const fileBlob = new Blob([imageBuffer], { type: "image/jpeg" });
        formData.append("file", fileBlob, fileName);

        const res = await fetch(`${baseUrl}/bubble/detect`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new AiServiceError("AI_SERVICE_ERROR", `AI service returned status ${res.status}: ${text}`, res.status);
        }

        const data = await res.json() as any;
        return data.bubbles || [];
      } catch (err: any) {
        if (err instanceof AiServiceError) throw err;
        throw new AiServiceError("AI_SERVICE_CONNECTION_ERROR", `Failed to connect to AI service: ${err.message}`);
      }
    },

    async processBubbles(imageBuffer: Buffer, fileName = "page.jpg"): Promise<YoloProcessResponse> {
      try {
        const formData = new FormData();
        const fileBlob = new Blob([imageBuffer], { type: "image/jpeg" });
        formData.append("file", fileBlob, fileName);

        const res = await fetch(`${baseUrl}/bubble/process`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new AiServiceError("AI_SERVICE_ERROR", `AI service returned status ${res.status}: ${text}`, res.status);
        }

        return await res.json() as YoloProcessResponse;
      } catch (err: any) {
        if (err instanceof AiServiceError) throw err;
        throw new AiServiceError("AI_SERVICE_CONNECTION_ERROR", `Failed to connect to AI service: ${err.message}`);
      }
    }
  };
}

export type AiService = ReturnType<typeof createAiService>;
