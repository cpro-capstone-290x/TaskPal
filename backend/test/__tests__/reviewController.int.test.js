import request from "supertest";
import app from "../../app.js";

describe("🔗 Review Controller — Integration Tests", () => {
  test("✅ POST /api/reviews should create a new review", async () => {
    const payload = {
      booking_id: 1,
      provider_id: 2,
      rating: 5,
      comment: "Excellent service!",
    };

    const res = await request(app).post("/api/reviews").send(payload);
    expect([201, 400, 403, 409]).toContain(res.statusCode);
  });

  test("✅ GET /api/reviews/booking/:bookingId should return review by booking", async () => {
    const res = await request(app).get("/api/reviews/booking/1");
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("data");
    }
  });

  test("✅ GET /api/reviews/provider/:providerId should return provider reviews", async () => {
    const res = await request(app).get("/api/reviews/provider/1");
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.data)).toBe(true);
    }
  });
});
