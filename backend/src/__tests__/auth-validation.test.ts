import request from "supertest";
import { createApp } from "../app.js";

describe("authentication request validation", () => {
  it("returns 400 VALIDATION_ERROR for an empty login payload", async () => {
    const response = await request(createApp()).post("/api/auth/login").send({}).expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 VALIDATION_ERROR for an empty refresh payload", async () => {
    const response = await request(createApp()).post("/api/auth/refresh").send({}).expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
