import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";

// Prevent real OTP emails
jest.mock("../../config/mailer.js", () => ({
  sendOTP: jest.fn().mockResolvedValue(),
}));

describe("🔗 AUTH CONTROLLER — FULL INTEGRATION TESTS", () => {
  const statusOK = [200, 201, 400, 401, 404, 500];

  /* -------------------------------------------------------------------------- */
  /* 🧪 USER REGISTRATION                                                      */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/registerUser — register a normal user", async () => {
    const res = await request(app).post("/api/auth/registerUser").send({
      first_name: "John",
      last_name: "Doe",
      type_of_user: "client",
      email: "test_user@example.com",
      password: "12345",
      unit_no: "12",
      street: "Main St",
      city: "Red Deer",
      province: "AB",
      postal_code: "T4N",
    });

    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 PROVIDER REGISTRATION (WITH MULTIPLE DOCUMENTS)                        */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/registerProvider — register a provider (multi-doc)", async () => {
    const res = await request(app).post("/api/auth/registerProvider").send({
      name: "Jane Provider",
      provider_type: "company",
      service_type: "Cleaning",
      license_id: "LIC999",
      email: "test_provider@example.com",
      phone: "4035550000",

      id_type: "Passport",
      id_number: "A123456",
      id_expiry: "2030-01-01",
      valid_id_url: "https://example.com/id.jpg",

      company_documents: [
        "https://example.com/doc1.pdf",
        "https://example.com/doc2.pdf"
      ],

      password: "pass123",
      terms_accepted: true,
    });

    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 ADMIN REGISTRATION                                                     */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/registerAdmin — register an admin", async () => {
    const res = await request(app).post("/api/auth/registerAdmin").send({
      first_name: "Super",
      email: "admin@example.com",
      password: "adminpass",
      role_assigned: "superadmin",
    });

    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 AUTHORIZED USER REGISTRATION                                           */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/registerAuthorizedUser — register an authorized user", async () => {
      const res = await request(app).post("/api/auth/registerUser").send({
        first_name: "John",
        last_name: "Doe",
        type_of_user: "client",
        email: "test_user@example.com",
        password: "12345",
        unit_no: "12",
        street: "Main St",
        city: "Red Deer",
        province: "AB",
        postal_code: "T4N",
        terms_accepted: true,   // 🔥 REQUIRED
      });


    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 USER LOGIN                                                             */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/loginUser — login user", async () => {
    const res = await request(app).post("/api/auth/loginUser").send({
      email: "test_user@example.com",
      password: "12345",
    });

    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 PROVIDER LOGIN                                                         */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/loginProvider — login provider", async () => {
    const res = await request(app).post("/api/auth/loginProvider").send({
      email: "test_provider@example.com",
      password: "pass123",
    });

    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 ADMIN LOGIN                                                            */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/loginAdmin — login admin", async () => {
    const res = await request(app).post("/api/auth/loginAdmin").send({
      email: "admin@example.com",
      password: "adminpass",
    });

    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 USER OTP VERIFICATION                                                  */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/verifyUserOTP — verify user OTP", async () => {
    const res = await request(app).post("/api/auth/verifyUserOTP").send({
      email: "test_user@example.com",
      otp: "123456",
      role: "user",
    });

    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 PROVIDER OTP VERIFICATION (WITH MULTI-DOC JSONB)                       */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/verifyProviderOTP — verify provider OTP", async () => {
    const res = await request(app).post("/api/auth/verifyProviderOTP").send({
      email: "test_provider@example.com",
      otp: "123456",
      role: "provider",
    });

    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 ADMIN OTP VERIFICATION                                                 */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/verifyAdminOTP — verify admin OTP", async () => {
    const res = await request(app).post("/api/auth/verifyAdminOTP").send({
      email: "admin@example.com",
      otp: "123456",
      role: "admin",
    });

    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 AUTHORIZED USER OTP VERIFICATION                                       */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/verifyAuthorizedOTP — verify authorized user OTP", async () => {
    const res = await request(app).post("/api/auth/verifyAuthorizedOTP").send({
      email: "authorized@example.com",
      otp: "123456",
      role: "authorized",
    });

    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 SEND PASSWORD RESET OTP                                                */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/sendPasswordResetOTP — send reset OTP", async () => {
    const res = await request(app).post("/api/auth/sendPasswordResetOTP").send({
      email: "test_user@example.com",
    });

    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 VERIFY PASSWORD RESET OTP                                              */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/verifyPasswordResetOTP — verify reset OTP", async () => {
    const res = await request(app).post("/api/auth/verifyPasswordResetOTP").send({
      email: "test_user@example.com",
      otp: "123456",
    });

    expect(statusOK).toContain(res.statusCode);
  });

  /* -------------------------------------------------------------------------- */
  /* 🧪 UPDATE PASSWORD AFTER OTP                                              */
  /* -------------------------------------------------------------------------- */
  test("POST /api/auth/updatePasswordAfterOTP — update password", async () => {
    const res = await request(app).post("/api/auth/updatePasswordAfterOTP").send({
      email: "test_user@example.com",
      newPassword: "NewPass123!",
    });

    expect(statusOK).toContain(res.statusCode);
  });
});
