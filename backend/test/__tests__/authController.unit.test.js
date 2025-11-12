import { jest } from "@jest/globals";

/* -------------------------------------------------------------------------- */
/* 🧠 Mock dependencies BEFORE import                                         */
/* -------------------------------------------------------------------------- */
jest.unstable_mockModule("../../config/db.js", () => {
  const sqlMock = jest.fn(async () => []); // default: always return empty array
  sqlMock.query = jest.fn(async () => []); // default: always return empty array
  return { sql: sqlMock };
});

jest.unstable_mockModule("../../config/mailer.js", () => ({
  sendOTP: jest.fn(),
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

/* -------------------------------------------------------------------------- */
/* 📦 Import modules after mocks                                              */
/* -------------------------------------------------------------------------- */
const dbMock = await import("../../config/db.js");
const mailerMock = await import("../../config/mailer.js");
const bcryptMock = (await import("bcrypt")).default;
const jwtMock = (await import("jsonwebtoken")).default;
const controller = await import("../../controllers/authController.js");

const {
  registerUser,
  verifyUserOTP,
  loginUser,
  sendPasswordResetOTP,
  updatePasswordAfterOTP,
} = controller;

/* -------------------------------------------------------------------------- */
/* 🧪 Test Suite                                                              */
/* -------------------------------------------------------------------------- */
describe("🧪 Auth Controller — Unit Tests", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dbMock.sql.mockReset();
    dbMock.sql.query.mockReset();
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 Registration Tests                                                  */
  /* ---------------------------------------------------------------------- */
  test("✅ registerUser should send OTP and insert pending registration", async () => {
    // Simulate the 4 table checks + insert
    dbMock.sql
      .mockResolvedValueOnce([]) // users
      .mockResolvedValueOnce([]) // providers
      .mockResolvedValueOnce([]) // admins
      .mockResolvedValueOnce([]) // authorized_users
      .mockResolvedValueOnce([]); // insert pending

    bcryptMock.hash
      .mockResolvedValueOnce("hashed_pw")
      .mockResolvedValueOnce("hashed_otp");

    mailerMock.sendOTP.mockResolvedValue();

    const req = {
      body: {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        password: "12345",
      },
    };

    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(mailerMock.sendOTP).toHaveBeenCalledWith("john@example.com", expect.any(String));
  });

  test("❌ registerUser missing fields returns 400", async () => {
    await registerUser({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 Login Tests                                                          */
  /* ---------------------------------------------------------------------- */
  test("✅ loginUser succeeds with valid credentials", async () => {
    dbMock.sql.mockResolvedValueOnce([
      {
        id: 1,
        email: "john@example.com",
        password: "hash",
        first_name: "John",
        last_name: "Doe",
      },
    ]);
    bcryptMock.compare.mockResolvedValueOnce(true);
    jwtMock.sign.mockReturnValue("mockToken");

    const req = { body: { email: "john@example.com", password: "12345" } };
    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("❌ loginUser invalid credentials returns 401", async () => {
    dbMock.sql.mockResolvedValueOnce([]); // no match
    const req = { body: { email: "none@example.com", password: "12345" } };
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 OTP Verification Tests                                               */
  /* ---------------------------------------------------------------------- */
  test("✅ verifyUserOTP succeeds for valid OTP", async () => {
    dbMock.sql
      .mockResolvedValueOnce([
        {
          id: 1,
          role: "user",
          email: "john@example.com",
          twofa_code: "hash",
          twofa_expires: new Date(Date.now() + 60000),
          payload: JSON.stringify({
            first_name: "John",
            last_name: "Doe",
            email: "john@example.com",
            password: "pw",
          }),
        },
      ])
      .mockResolvedValueOnce([{ id: 1 }]); // insert user after verification

    bcryptMock.compare.mockResolvedValueOnce(true);

    const req = { body: { email: "john@example.com", otp: "123456", role: "user" } };
    await verifyUserOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ verifyUserOTP invalid OTP returns 400", async () => {
    dbMock.sql.mockResolvedValueOnce([
      {
        id: 1,
        twofa_code: "hash",
        twofa_expires: new Date(Date.now() + 60000),
        payload: "{}",
      },
    ]);
    bcryptMock.compare.mockResolvedValueOnce(false);

    const req = { body: { email: "john@example.com", otp: "wrong", role: "user" } };
    await verifyUserOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 Password Reset Tests                                                 */
  /* ---------------------------------------------------------------------- */
  test("✅ sendPasswordResetOTP should send OTP", async () => {
    // 3 parallel checks for users/providers/admins + insert pending
    dbMock.sql
      .mockResolvedValueOnce([{ id: 1, email: "john@example.com" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]); // insert

    bcryptMock.hash.mockResolvedValueOnce("hashedOtp");
    mailerMock.sendOTP.mockResolvedValueOnce();

    const req = { body: { email: "john@example.com" } };
    await sendPasswordResetOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ updatePasswordAfterOTP invalid email returns 404", async () => {
    // 3 parallel account lookups (users/providers/admins)
    dbMock.sql
      .mockResolvedValueOnce([]) // users
      .mockResolvedValueOnce([]) // providers
      .mockResolvedValueOnce([]); // admins

    const req = { body: { email: "x@x.com", newPassword: "new123" } };
    await updatePasswordAfterOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
