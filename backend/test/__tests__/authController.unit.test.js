/**
 * COMPLETE AUTH CONTROLLER TEST SUITE
 * Fully aligned with your full updated controller
 */

import { jest } from "@jest/globals";

/* ------------------------------------------------------------- */
/* 🔥 MOCK DEPENDENCIES BEFORE IMPORTING CONTROLLER               */
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
/* 📦 IMPORT CONTROLLERS AFTER MOCKING                            */
/* ------------------------------------------------------------- */
const dbMock = await import("../../config/db.js");
const mailerMock = await import("../../config/mailer.js");
const bcryptMock = (await import("bcrypt")).default;
const jwtMock = (await import("jsonwebtoken")).default;

const controller = await import("../../controllers/authController.js");

const {
  registerUser,
  registerProvider,
  registerAdmin,
  registerAuthorizedUser,
  verifyUserOTP,
  verifyProviderOTP,
  verifyAdminOTP,
  verifyAuthorizedOTP,
  loginUser,
  loginProvider,
  loginAdmin,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  updatePasswordAfterOTP,
  getAuthorizedUsers,
  deleteAuthorizedUser,
} = controller;

/* ------------------------------------------------------------- */
/* COMMON MOCK RESPONSE OBJECT                                   */
/* ------------------------------------------------------------- */
let res;

beforeEach(() => {
  res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  jest.clearAllMocks();
  dbMock.sql.mockReset();
  dbMock.sql.query.mockReset();
});

/* ------------------------------------------------------------- */
/* 🧪 TEST SUITE                                                  */
/* ------------------------------------------------------------- */
describe("🔥 AUTH CONTROLLER – FULL TEST SUITE", () => {

  /* ============================================================
     USER REGISTRATION
  ============================================================ */
  test("✅ registerUser inserts into pending_registrations", async () => {
    dbMock.sql
      .mockResolvedValueOnce([]) 
      .mockResolvedValueOnce([]) 
      .mockResolvedValueOnce([]) 
      .mockResolvedValueOnce([]) 
      .mockResolvedValueOnce([]); 

    bcryptMock.hash
      .mockResolvedValueOnce("hashed_pw")
      .mockResolvedValueOnce("hashed_otp");

    const req = {
      body: { first_name: "John", last_name: "Doe", email: "john@test.com", password: "123" },
    };

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mailerMock.sendOTP).toHaveBeenCalled();
  });

  test("❌ registerUser fails with missing fields", async () => {
    await registerUser({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* ============================================================
     PROVIDER REGISTRATION
  ============================================================ */
  test("❌ registerProvider should require terms_accepted", async () => {
    const req = {
      body: {
        name: "Jane",
        provider_type: "individual",
        service_type: "Cleaning",
        email: "x@test.com",
        password: "123",
        terms_accepted: false,
      },
    };

    await registerProvider(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("✅ registerProvider inserts pending registration", async () => {
    dbMock.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    bcryptMock.hash
      .mockResolvedValueOnce("hashed_pw")
      .mockResolvedValueOnce("hashed_otp");

    const req = {
      body: {
        name: "Provider",
        provider_type: "ind",
        service_type: "cleaning",
        license_id: "LIC",
        id_type: "Passport",
        id_number: "123",
        id_expiry: "2030-01-01",
        valid_id_url: "id.png",
        email: "p@test.com",
        phone: "123",
        password: "pass",
        terms_accepted: true,
      },
    };

    await registerProvider(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mailerMock.sendOTP).toHaveBeenCalled();
  });

  /* ============================================================
     ADMIN REGISTRATION
  ============================================================ */
  test("❌ registerAdmin missing fields", async () => {
    await registerAdmin({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("✅ registerAdmin inserts pending admin registration", async () => {
    dbMock.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    bcryptMock.hash
      .mockResolvedValueOnce("hashed_pw")
      .mockResolvedValueOnce("hashed_otp");

    const req = {
      body: {
        first_name: "Admin",
        email: "admin@test.com",
        password: "pass",
        role_assigned: "super",
      },
    };

    await registerAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  /* ============================================================
     AUTHORIZED USER REGISTRATION
  ============================================================ */
  test("❌ registerAuthorizedUser missing fields", async () => {
    await registerAuthorizedUser({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("✅ registerAuthorizedUser inserts pending", async () => {
    dbMock.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    bcryptMock.hash
      .mockResolvedValueOnce("hashed_pw")
      .mockResolvedValueOnce("hashed_otp");

    const req = {
      body: {
        client_id: 1,
        first_name: "Auth",
        last_name: "User",
        relationship: "son",
        email: "auth@test.com",
        password: "123",
      },
    };

    await registerAuthorizedUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  /* ============================================================
     USER OTP VERIFICATION
  ============================================================ */
  test("❌ verifyUserOTP invalid OTP", async () => {
    dbMock.sql.mockResolvedValueOnce([
      { id: 1, twofa_code: "hash", twofa_expires: new Date(Date.now() + 60000), payload: "{}" },
    ]);

    bcryptMock.compare.mockResolvedValueOnce(false);

    const req = { body: { email: "x@test.com", otp: "000000", role: "user" } };
    await verifyUserOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* ============================================================
     PROVIDER VERIFICATION
  ============================================================ */
  test("✅ verifyProviderOTP inserts provider", async () => {
    const fakeData = {
      name: "Jane",
      provider_type: "ind",
      service_type: "clean",
      license_id: "LIC",
      email: "p@test.com",
      password: "hashed",
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
    };

    dbMock.sql
      .mockResolvedValueOnce([
        {
          id: 10,
          twofa_code: "hash",
          twofa_expires: new Date(Date.now() + 60000),
          payload: JSON.stringify(fakeData),
        },
      ])
      .mockResolvedValueOnce([{ id: 99 }])
      .mockResolvedValueOnce([]);

    bcryptMock.compare.mockResolvedValueOnce(true);

    const req = { body: { email: "p@test.com", otp: "123456", role: "provider" } };
    await verifyProviderOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  /* ============================================================
     ADMIN VERIFICATION
  ============================================================ */
  test("❌ verifyAdminOTP invalid OTP", async () => {
    dbMock.sql.mockResolvedValueOnce([
      { twofa_code: "hash", twofa_expires: new Date(Date.now() + 60000), payload: "{}" },
    ]);

    bcryptMock.compare.mockResolvedValueOnce(false);

    const req = { body: { email: "admin@test.com", otp: "111", role: "admin" } };
    await verifyAdminOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* ============================================================
     AUTHORIZED USER VERIFICATION
  ============================================================ */
  test("❌ verifyAuthorizedOTP expired", async () => {
    dbMock.sql.mockResolvedValueOnce([
      { twofa_code: "hash", twofa_expires: new Date(Date.now() - 1000), payload: "{}" },
    ]);

    bcryptMock.compare.mockResolvedValueOnce(true);

    const req = { body: { email: "auth@test.com", otp: "1", role: "authorized" } };
    await verifyAuthorizedOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* ============================================================
     LOGIN
  ============================================================ */
  test("❌ loginUser - wrong email", async () => {
    dbMock.sql.mockResolvedValueOnce([]);

    const req = { body: { email: "wrong@test.com", password: "123" } };
    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("❌ loginProvider - wrong password", async () => {
    dbMock.sql.mockResolvedValueOnce([{ email: "p@test.com", password: "aaa" }]);
    bcryptMock.compare.mockResolvedValueOnce(false);

    await loginProvider({ body: { email: "p@test.com", password: "123" } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("✅ loginAdmin success", async () => {
    dbMock.sql.mockResolvedValueOnce([
      { id: 1, email: "a@test.com", password: "abc", role: "super" },
    ]);

    bcryptMock.compare.mockResolvedValueOnce(true);
    jwtMock.sign.mockReturnValue("token");

    await loginAdmin({ body: { email: "a@test.com", password: "abc" } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  /* ============================================================
     PASSWORD RESET
  ============================================================ */
  test("✔ sendPasswordResetOTP success", async () => {
    dbMock.sql
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    bcryptMock.hash.mockResolvedValueOnce("hashedotp");

    await sendPasswordResetOTP({ body: { email: "x@test.com" } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ verifyPasswordResetOTP expired", async () => {
    dbMock.sql.mockResolvedValueOnce([
      {
        twofa_code: "hash",
        twofa_expires: new Date(Date.now() - 1000),
      },
    ]);

    bcryptMock.compare.mockResolvedValueOnce(true);

    await verifyPasswordResetOTP(
      { body: { email: "x@test.com", otp: "123" } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("❌ updatePasswordAfterOTP no account found", async () => {
    dbMock.sql.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await updatePasswordAfterOTP(
      { body: { email: "no@test.com", newPassword: "pass" } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* ============================================================
     AUTHORIZED USER GET/DELETE
  ============================================================ */
  test("✔ getAuthorizedUsers returns data", async () => {
    dbMock.sql.mockResolvedValueOnce([{ id: 1 }]);

    await getAuthorizedUsers({ params: { userId: 1 } }, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test("✔ deleteAuthorizedUser deletes user", async () => {
    dbMock.sql.mockResolvedValueOnce([]);

    await deleteAuthorizedUser({ params: { authUserId: 1 } }, res);

    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
