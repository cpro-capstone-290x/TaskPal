/**
 * Auth Controller — COMPLETE UNIT TEST SUITE
 * Fully aligned with your current authController.js
 */

import { jest } from "@jest/globals";

/* ------------------------------------------------------------- */
/* 🧠 MOCK DEPENDENCIES BEFORE IMPORTING CONTROLLERS              */
/* ------------------------------------------------------------- */
jest.unstable_mockModule("../../config/db.js", () => {
  const sqlFn = jest.fn(async () => []);
  sqlFn.query = jest.fn(async () => []);
  return { sql: sqlFn };
});

jest.unstable_mockModule("../../config/mailer.js", () => ({
  sendOTP: jest.fn().mockResolvedValue(),
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
}));

/* ------------------------------------------------------------- */
/* 📦 IMPORTS AFTER MOCKING                                      */
/* ------------------------------------------------------------- */
const dbMock = await import("../../config/db.js");
const mailerMock = await import("../../config/mailer.js");
const bcryptMock = (await import("bcrypt")).default;
const jwtMock = (await import("jsonwebtoken")).default;

const controller = await import("../../controllers/authController.js");

const {
  registerUser,
  registerProvider,
  verifyUserOTP,
  verifyProviderOTP,
  loginUser,
  sendPasswordResetOTP,
  updatePasswordAfterOTP,
} = controller;

/* ------------------------------------------------------------- */
/* COMMON MOCKED RESPONSE OBJ                                    */
/* ------------------------------------------------------------- */
const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};

/* ------------------------------------------------------------- */
/* BEFORE EACH TEST                                              */
/* ------------------------------------------------------------- */
beforeEach(() => {
  jest.clearAllMocks();
  dbMock.sql.mockReset();
  dbMock.sql.query.mockReset();
});

/* ------------------------------------------------------------- */
/* 🧪 TEST SUITE                                                 */
/* ------------------------------------------------------------- */
describe("🧪 AUTH CONTROLLER – UNIT TESTS", () => {

  /* ============================================================
     USER REGISTRATION
  ============================================================ */
  test("✅ registerUser inserts pending_registrations and sends OTP", async () => {
    // DB lookups (users, providers, admins, authorized)
    dbMock.sql
      .mockResolvedValueOnce([]) // users
      .mockResolvedValueOnce([]) // providers
      .mockResolvedValueOnce([]) // admins
      .mockResolvedValueOnce([]) // authorized_users
      .mockResolvedValueOnce([]); // insert pending

    bcryptMock.hash
      .mockResolvedValueOnce("hashed_pw")
      .mockResolvedValueOnce("hashed_otp");

    const req = {
      body: {
        first_name: "John",
        last_name: "Doe",
        email: "john@test.com",
        password: "12345",
      },
    };

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mailerMock.sendOTP).toHaveBeenCalled();
  });

  test("❌ registerUser fails - missing fields", async () => {
    await registerUser({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* ============================================================
     PROVIDER REGISTRATION
  ============================================================ */
  test("❌ registerProvider should reject missing terms_accepted", async () => {
    const req = {
      body: {
        name: "Jane",
        provider_type: "individual",
        service_type: "Cleaning",
        email: "jane@test.com",
        password: "12345",
        terms_accepted: false,
      },
    };

    await registerProvider(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("✅ registerProvider inserts pending registration", async () => {
    dbMock.sql
      .mockResolvedValueOnce([]) // users
      .mockResolvedValueOnce([]) // providers
      .mockResolvedValueOnce([]) // admins
      .mockResolvedValueOnce([]) // authorized
      .mockResolvedValueOnce([]); // insert pending

    bcryptMock.hash
      .mockResolvedValueOnce("hashed_pw")
      .mockResolvedValueOnce("hashed_otp");

    const req = {
      body: {
        name: "Jane Cleaner",
        provider_type: "individual",
        service_type: "Cleaning",
        license_id: "LIC123",
        email: "provider@test.com",
        phone: "123",
        password: "pass123",
        terms_accepted: true,
      },
    };

    await registerProvider(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mailerMock.sendOTP).toHaveBeenCalled();
  });

  /* ============================================================
     USER OTP VERIFICATION
  ============================================================ */
  test("❌ verifyUserOTP invalid OTP", async () => {
    dbMock.sql.mockResolvedValueOnce([
      {
        id: 1,
        twofa_code: "hash",
        twofa_expires: new Date(Date.now() + 60000),
        payload: "{}",
      },
    ]);

    bcryptMock.compare.mockResolvedValueOnce(false);

    const req = { body: { email: "x@test.com", otp: "000000", role: "user" } };
    await verifyUserOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* ============================================================
     PROVIDER OTP VERIFICATION
  ============================================================ */
  test("✅ verifyProviderOTP inserts provider with terms", async () => {
    const fakeData = {
      name: "Jane Cleaner",
      provider_type: "individual",
      service_type: "Cleaning",
      license_id: "123",
      email: "provider@test.com",
      phone: "123456",
      password: "hashedpw",
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
    };

    // Mock pending data
    dbMock.sql
      .mockResolvedValueOnce([
        {
          id: 10,
          email: "provider@test.com",
          twofa_code: "hash",
          twofa_expires: new Date(Date.now() + 60000),
          payload: JSON.stringify(fakeData),
        },
      ])
      .mockResolvedValueOnce([{ id: 99, ...fakeData }]) // INSERT provider
      .mockResolvedValueOnce([]); // DELETE pending

    bcryptMock.compare.mockResolvedValueOnce(true);

    const req = {
      body: {
        email: "provider@test.com",
        otp: "123456",
        role: "provider",
      },
    };

    await verifyProviderOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          terms_accepted: true,
        }),
      })
    );
  });

  /* ============================================================
     LOGIN
  ============================================================ */
  test("❌ loginUser invalid email", async () => {
    dbMock.sql.mockResolvedValueOnce([]); // no user
    const req = { body: { email: "x@test.com", password: "123" } };
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("✅ loginUser success", async () => {
    dbMock.sql.mockResolvedValueOnce([
      {
        id: 1,
        email: "john@test.com",
        password: "hashedpw",
        first_name: "John",
        last_name: "Doe",
      },
    ]);

    bcryptMock.compare.mockResolvedValueOnce(true);
    jwtMock.sign.mockReturnValue("token123");

    const req = { body: { email: "john@test.com", password: "123" } };
    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  /* ============================================================
     PASSWORD RESET
  ============================================================ */
  test("✔ sendPasswordResetOTP sends OTP when email exists", async () => {
    dbMock.sql
      .mockResolvedValueOnce([{ id: 1 }]) // users
      .mockResolvedValueOnce([]) // providers
      .mockResolvedValueOnce([]) // admins
      .mockResolvedValueOnce([]); // insert pending

    bcryptMock.hash.mockResolvedValueOnce("hashedotp");

    const req = { body: { email: "john@test.com" } };
    await sendPasswordResetOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ updatePasswordAfterOTP fails if email not found", async () => {
    dbMock.sql
      .mockResolvedValueOnce([]) // users
      .mockResolvedValueOnce([]) // providers
      .mockResolvedValueOnce([]); // admins

    const req = { body: { email: "missing@test.com", newPassword: "pass" } };
    await updatePasswordAfterOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
