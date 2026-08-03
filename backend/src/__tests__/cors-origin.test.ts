import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("CORS origin", () => {
  it("allows local development origins", async () => {
    const res = await request(createApp())
      .get("/health")
      .set("Origin", "http://localhost:8080");
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:8080");
  });

  it.each(["http://localhost:8081", "http://127.0.0.1:8081", "http://192.168.126.1:8080"])(
    "allows the mobile web preflight from %s",
    async (origin) => {
      const res = await request(createApp())
        .options("/api/auth/login")
        .set("Origin", origin)
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "content-type");

      expect(res.status).toBe(204);
      expect(res.headers["access-control-allow-origin"]).toBe(origin);
      expect(res.headers["access-control-allow-credentials"]).toBe("true");
      expect(res.headers["access-control-allow-methods"])
        .toBeDefined();
      expect(res.headers["access-control-allow-methods"].split(",")).toContain("POST");
      expect(res.headers["access-control-allow-headers"]?.toLowerCase().split(","))
        .toContain("content-type");
    }
  );

  it("does not echo an arbitrary request origin", async () => {
    const res = await request(createApp())
      .get("/health")
      .set("Origin", "https://evil.example");
    expect(res.headers["access-control-allow-origin"]).not.toBe("https://evil.example");
  });
});
