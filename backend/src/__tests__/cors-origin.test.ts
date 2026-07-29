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

  it("does not echo an arbitrary request origin", async () => {
    const res = await request(createApp())
      .get("/health")
      .set("Origin", "https://evil.example");
    expect(res.headers["access-control-allow-origin"]).not.toBe("https://evil.example");
  });
});
