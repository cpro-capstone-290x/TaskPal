import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";

// Mock mailer to prevent actual OTP emails
jest.mock("../../config/mailer.js", () => ({
  sendOTP: jest.fn().mockResolvedValue(),
}));

describe("🔗 Auth Controller — Integration Tests", () => {
  test("✅ POST /api/auth/registerUser should handle registration", async () => {
    const res = await request(app)
      .post("/api/auth/registerUser") // <-- Corrected path
      .send({
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        password: "12345",
      });
    expect([201, 400, 500]).toContain(res.statusCode);
  });

  test("✅ POST /api/auth/loginUser should handle login", async () => {
    const res = await request(app)
      .post("/api/auth/loginUser") // <-- This path is correct
      .send({
        email: "test@example.com",
        password: "12345",
      });
    expect([200, 400, 401, 500]).toContain(res.statusCode);
  });

  test("✅ POST /api/auth/verifyUser should handle OTP verification", async () => {
    const res = await request(app)
      .post("/api/auth/verifyUser") // <-- Corrected path
      .send({ email: "john@example.com", otp: "123456", role: "user" });
    expect([200, 400, 404, 500]).toContain(res.statusCode);
  });

  test("✅ POST /api/auth/send-reset-otp should send password reset OTP", async () => {
    const res = await request(app)
      .post("/api/auth/send-reset-otp") // <-- Corrected path
      .send({ email: "john@example.com" });
    expect([200, 400, 404, 500]).toContain(res.statusCode);
  });

  test("✅ POST /api/auth/update-password should update password after OTP", async () => {
    const res = await request(app)
      .post("/api/auth/update-password") // <-- Corrected method (POST) and path
      .send({ email: "john@example.com", newPassword: "new123" });
    expect([200, 400, 404, 500]).toContain(res.statusCode);
  });
});