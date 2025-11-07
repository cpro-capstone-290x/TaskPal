import { jest } from "@jest/globals";

/* -------------------------------------------------------------------------- */
/* 🧠 Mock dependencies BEFORE import                                         */
/* -------------------------------------------------------------------------- */
jest.unstable_mockModule("../../config/db.js", () => {
  const sqlMock = jest.fn(async () => []); // Default to return array
  return { sql: sqlMock };
});

/* -------------------------------------------------------------------------- */
/* 📦 Import controller AFTER mocks                                           */
/* -------------------------------------------------------------------------- */
const dbMock = await import("../../config/db.js");
const controller = await import("../../controllers/adminController.js");

const {
  getAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getPendingProviders,
  getProviderForAdmin,
} = controller;

/* -------------------------------------------------------------------------- */
/* 🧪 Unit Tests for Admin Controller                                         */
/* -------------------------------------------------------------------------- */
describe("🧩 Admin Controller — Unit Tests", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dbMock.sql.mockReset();
  });

  /* ---------------------------------------------------------------------- */
  /* 📘 getAdmins                                                          */
  /* ---------------------------------------------------------------------- */
  test("✅ getAdmins returns list of admins", async () => {
    dbMock.sql.mockResolvedValueOnce([{ id: 1, first_name: "Admin1" }]);
    await getAdmins({}, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: 1, first_name: "Admin1" }],
    });
  });

  test("❌ getAdmins handles error", async () => {
    dbMock.sql.mockRejectedValueOnce(new Error("DB fail"));
    await getAdmins({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  /* ---------------------------------------------------------------------- */
  /* 📘 getAdmin                                                           */
  /* ---------------------------------------------------------------------- */
  test("✅ getAdmin returns single admin", async () => {
    dbMock.sql.mockResolvedValueOnce([{ id: 1, first_name: "Alice" }]);
    await getAdmin({ params: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1, first_name: "Alice" },
    });
  });

  test("❌ getAdmin returns 404 when not found", async () => {
    dbMock.sql.mockResolvedValueOnce([]);
    await getAdmin({ params: { id: 999 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 createAdmin                                                        */
  /* ---------------------------------------------------------------------- */
  test("✅ createAdmin inserts new admin", async () => {
    dbMock.sql.mockResolvedValueOnce([{ id: 1, email: "a@a.com" }]);
    const req = {
      body: { first_name: "John", email: "a@a.com", password: "123", role: "manager" },
    };
    await createAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1, email: "a@a.com" },
    });
  });

  test("❌ createAdmin missing fields returns 400", async () => {
    await createAdmin({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("❌ createAdmin unique violation returns 400", async () => {
    const err = new Error();
    err.code = "23505";
    dbMock.sql.mockRejectedValueOnce(err);
    const req = {
      body: { first_name: "John", email: "a@a.com", password: "123", role: "manager" },
    };
    await createAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 updateAdmin                                                        */
  /* ---------------------------------------------------------------------- */
  test("✅ updateAdmin updates admin info", async () => {
    dbMock.sql
      .mockResolvedValueOnce([{ id: 1, first_name: "Old" }]) // existing admin
      .mockResolvedValueOnce([{ id: 1, first_name: "Updated" }]); // update result

    const req = { params: { id: 1 }, body: { first_name: "Updated" } };
    await updateAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ updateAdmin returns 404 if not found", async () => {
    dbMock.sql.mockResolvedValueOnce([]); // no admin found
    const req = { params: { id: 1 }, body: {} };
    await updateAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("❌ updateAdmin handles unique violation", async () => {
    const err = new Error();
    err.code = "23505";
    dbMock.sql.mockRejectedValueOnce(err);
    const req = { params: { id: 1 }, body: { first_name: "Dup" } };
    await updateAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 deleteAdmin                                                        */
  /* ---------------------------------------------------------------------- */
  test("✅ deleteAdmin deletes admin", async () => {
    dbMock.sql
      .mockResolvedValueOnce([{ id: 1, first_name: "DeleteMe" }]) // existing
      .mockResolvedValueOnce([{ id: 1 }]); // deleted
    const req = { params: { id: 1 } };
    await deleteAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ deleteAdmin returns 404 if not found", async () => {
    dbMock.sql.mockResolvedValueOnce([]); // not found
    const req = { params: { id: 999 } };
    await deleteAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 getPendingProviders                                                */
  /* ---------------------------------------------------------------------- */
  test("✅ getPendingProviders returns list", async () => {
    dbMock.sql.mockResolvedValueOnce([{ id: 1, name: "CleanCo" }]);
    await getPendingProviders({}, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ getPendingProviders handles error", async () => {
    dbMock.sql.mockRejectedValueOnce(new Error("DB error"));
    await getPendingProviders({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 getProviderForAdmin                                                */
  /* ---------------------------------------------------------------------- */
  test("✅ getProviderForAdmin returns provider details", async () => {
    dbMock.sql.mockResolvedValueOnce([{ id: 1, name: "Provider A" }]);
    await getProviderForAdmin({ params: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ getProviderForAdmin 404 when provider not found", async () => {
    dbMock.sql.mockResolvedValueOnce([]);
    await getProviderForAdmin({ params: { id: 99 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
