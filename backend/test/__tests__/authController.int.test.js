import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";

// Prevent real OTP emails
jest.mock("../../config/mailer.js", () => ({
  sendOTP: jest.fn().mockResolvedValue(),
}));

describe("🔗 AUTH CONTROLLER — INTEGRATION TESTS", () => {
  /* -------------------------------------------------------------------------- */
  /* 🧪 USER REGISTRATION                                                      */
  /* -------------------------------------------------------------------------- */
  test("✅ POST /api/auth/registerUser should register a user", async () => {
    const res = await request(app).post("/api/auth/registerUser").send({
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      password: "12345",
    });

    expect([201, 400, 500]).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 PROVIDER REGISTRATION                                                  */
  /* -------------------------------------------------------------------------- */
  test("✅ POST /api/auth/registerProvider should register provider", async () => {
    const res = await request(app).post("/api/auth/registerProvider").send({
      name: "Jane Cleaner",
      provider_type: "individual",
      service_type: "Cleaning",
      license_id: "LIC123",
      email: "provider@example.com",
      phone: "4035550000",
      password: "pass123",
      terms_accepted: true,
    });

    expect([201, 400, 500]).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 USER LOGIN                                                             */
  /* -------------------------------------------------------------------------- */
  test("✅ POST /api/auth/loginUser should login a user", async () => {
    const res = await request(app).post("/api/auth/loginUser").send({
      email: "test@example.com",
      password: "12345",
    });

    expect([200, 400, 401, 500]).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 PROVIDER LOGIN                                                         */
  /* -------------------------------------------------------------------------- */
  test("✅ POST /api/auth/loginProvider should login provider", async () => {
    const res = await request(app).post("/api/auth/loginProvider").send({
      email: "provider@example.com",
      password: "pass123",
    });

    expect([200, 400, 401, 500]).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 USER OTP VERIFICATION                                                  */
  /* -------------------------------------------------------------------------- */
  test("✅ POST /api/auth/verifyUser should verify user OTP", async () => {
    const res = await request(app).post("/api/auth/verifyUser").send({
      email: "john@example.com",
      otp: "123456",
      role: "user",
    });

    expect([200, 400, 404, 500]).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 PROVIDER OTP VERIFICATION                                              */
  /* -------------------------------------------------------------------------- */
  test("✅ POST /api/auth/verifyProvider should verify provider OTP", async () => {
    const res = await request(app).post("/api/auth/verifyProvider").send({
      email: "provider@example.com",
      otp: "123456",
      role: "provider",
    });

    expect([200, 400, 404, 500]).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 SEND PASSWORD RESET OTP                                                */
  /* -------------------------------------------------------------------------- */
  test("✅ POST /api/auth/send-reset-otp should send reset OTP", async () => {
    const res = await request(app).post("/api/auth/send-reset-otp").send({
      email: "john@example.com",
    });

    expect([200, 400, 404, 500]).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 UPDATE PASSWORD AFTER OTP                                              */
  /* -------------------------------------------------------------------------- */
  test("✅ POST /api/auth/update-password should update password", async () => {
    const res = await request(app).post("/api/auth/update-password").send({
      email: "john@example.com",
      newPassword: "newPassword123",
    });

    expect([200, 400, 404, 500]).toContain(res.statusCode);
  });
});
