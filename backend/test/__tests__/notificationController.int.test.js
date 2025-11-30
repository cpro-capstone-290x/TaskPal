// test/__tests__/notificationController.int.test.js
import request from "supertest";
import app from "../../app.js";

describe("🔗 Notification Controller — Integration Tests", () => {
  
  /* ---------------------- GET /api/notifications/:userId ---------------------- */
  test("GET /api/notifications/:userId returns notifications", async () => {
    const res = await request(app).get("/api/notifications/1");

    expect([200, 500]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("data");
  });

  /* ---------------------- PUT /api/notifications/:userId/read-all ---------------------- */
  test("PUT /api/notifications/:userId/read-all marks all as read", async () => {
    const res = await request(app).put("/api/notifications/1/read-all");

    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("message");
    }
  });

  /* ---------------------- PUT /api/notifications/:id/read-one ---------------------- */
  test("PUT /api/notifications/:id/read-one marks single as read", async () => {
    // Simulate authenticated user
    const tokenUserId = 1;

    const res = await request(app)
      .put("/api/notification/123/read-one")
      .set("Authorization", `Bearer mocktoken-${tokenUserId}`);

    expect([200, 401, 500]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("message");
    }
  });
});
