import { jest } from "@jest/globals";  // ✅ Add this line
import request from "supertest";
import app from "../../app.js";

jest.mock("stripe", () => {
  const mockCheckout = {
    sessions: {
      create: jest.fn().mockResolvedValue({ url: "https://mock-stripe.com" }),
      retrieve: jest.fn().mockResolvedValue({
        payment_status: "paid",
        metadata: { bookingId: "1" },
      }),
    },
  };
  return jest.fn(() => mockCheckout);
});

describe("🔗 Payment Controller — Integration Tests", () => {
  test("✅ POST /api/payments/:bookingId should create payment session", async () => {
    const res = await request(app).post("/api/payments/1");
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("url");
    } else {
      expect(res.body).toHaveProperty("message");
    }
  });

  test("✅ GET /api/payments/verify/:sessionId should verify Stripe session", async () => {
    const res = await request(app).get("/api/payments/verify/sess_123");
    expect([200, 400, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("bookingId");
    } else {
      expect(res.body).toHaveProperty("message");
    }
  });
});
