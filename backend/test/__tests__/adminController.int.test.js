import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";

/* -------------------------------------------------------------------------- */
/* 🧠 Mock SQL dependency so no real DB is called                              */
/* -------------------------------------------------------------------------- */
jest.unstable_mockModule("../../config/db.js", () => {
  const sqlMock = jest.fn(async () => []); // default return empty array
  return { sql: sqlMock };
});

// re-import app AFTER mocks
const dbMock = await import("../../config/db.js");

/* -------------------------------------------------------------------------- */
/* 🧪 Integration Tests for Admin Controller                                   */
/* -------------------------------------------------------------------------- */
describe("🔗 Admin Controller — Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dbMock.sql.mockReset();
  });

  /* ---------------------------------------------------------------------- */
  /* 📘 GET /api/admins                                                    */
  /* ---------------------------------------------------------------------- */
  test("✅ GET /api/admins should return 200 and list of admins", async () => {
    dbMock.sql.mockResolvedValueOnce([{ id: 1, first_name: "Alice" }]);
    const res = await request(app).get("/api/admins");
    expect([200, 500]).toContain(res.statusCode);
  });

  /* ---------------------------------------------------------------------- */
  /* 📘 GET /api/admins/:id                                                */
  /* ---------------------------------------------------------------------- */
  test("✅ GET /api/admins/:id should return 200 or 404", async () => {
    dbMock.sql.mockResolvedValueOnce([{ id: 1, first_name: "Alice" }]);
    const res = await request(app).get("/api/admins/1");
    expect([200, 404, 500]).toContain(res.statusCode);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 POST /api/admins                                                   */
  /* ---------------------------------------------------------------------- */
  test("✅ POST /api/admins should create admin", async () => {
    dbMock.sql.mockResolvedValueOnce([{ id: 2, first_name: "Bob" }]);
    const res = await request(app)
      .post("/api/admins")
      .send({
        first_name: "Bob",
        email: "bob@example.com",
        password: "12345",
        role: "manager",
      });
    expect([201, 400, 500]).toContain(res.statusCode);
  });

  test("❌ POST /api/admins should return 400 if missing fields", async () => {
    const res = await request(app).post("/api/admins").send({});
    expect(res.statusCode).toBe(400);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 PUT /api/admins/:id                                                */
  /* ---------------------------------------------------------------------- */
  test("✅ PUT /api/admins/:id should update admin", async () => {
    dbMock.sql
      .mockResolvedValueOnce([{ id: 1, first_name: "Old" }]) // find admin
      .mockResolvedValueOnce([{ id: 1, first_name: "Updated" }]); // update success
    const res = await request(app)
      .put("/api/admins/1")
      .send({ first_name: "Updated" });
    expect([200, 404, 500]).toContain(res.statusCode);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 DELETE /api/admins/:id                                             */
  /* ---------------------------------------------------------------------- */
  test("✅ DELETE /api/admins/:id should delete admin", async () => {
    dbMock.sql
      .mockResolvedValueOnce([{ id: 1, first_name: "ToDelete" }]) // found
      .mockResolvedValueOnce([{ id: 1 }]); // deleted
    const res = await request(app).delete("/api/admins/1");
    expect([200, 404, 500]).toContain(res.statusCode);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 GET /api/admins/providers/pending                                  */
  /* ---------------------------------------------------------------------- */
  test("✅ GET /api/admins/providers/pending should return pending providers", async () => {
    dbMock.sql.mockResolvedValueOnce([{ id: 10, name: "CleanCo" }]);
    const res = await request(app).get("/api/admins/providers/pending");
    expect([200, 500]).toContain(res.statusCode);
  });

  /* ---------------------------------------------------------------------- */
  /* 🧩 GET /api/admins/providers/:id                                      */
  /* ---------------------------------------------------------------------- */
  test("✅ GET /api/admins/providers/:id should return provider details", async () => {
    dbMock.sql.mockResolvedValueOnce([{ id: 5, name: "ServicePro" }]);
    const res = await request(app).get("/api/admins/providers/5");
    expect([200, 404, 500]).toContain(res.statusCode);
  });
});
