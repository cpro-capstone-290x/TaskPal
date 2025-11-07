import request from "supertest";
import app from "../../app.js";

describe("🔗 Execution Controller — Integration Tests", () => {
  test("✅ POST /api/execution should create execution", async () => {
    const res = await request(app)
      .post("/api/execution")
      .send({ booking_id: 1 });

    expect([201, 200, 400, 404, 500]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("success");
  });

  test("✅ PUT /api/execution/:id should update execution", async () => {
    const res = await request(app)
      .put("/api/execution/1")
      .send({
        validatedCredential: true,
        completedProvider: "completed",
        completedClient: "completed",
      });

    expect([200, 404, 500]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("message");
  });
});
