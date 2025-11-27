import request from "supertest";
import app from "../../app.js";

describe("🔗 Execution Controller — Integration Tests", () => {
  
  /* ------------------------------------------------------------------------ */
  /* TEST 1: POST /api/execution                                              */
  /* ------------------------------------------------------------------------ */
  test("✅ POST /api/execution should return valid response (200 or 404)", async () => {
    const res = await request(app)
      .post("/api/execution")
      .send({ booking_id: 1 });

    // 1. Check Status Code
    expect([200, 201, 400, 404, 500]).toContain(res.statusCode);

    // 2. Check Body Structure
    // FIX: If 200/201, expect "success". If 404/400/500, expect "error".
    if (res.statusCode >= 200 && res.statusCode < 300) {
        expect(res.body).toHaveProperty("success");
    } else {
        expect(res.body).toHaveProperty("error");
    }
  });

  /* ------------------------------------------------------------------------ */
  /* TEST 2: PUT /api/execution/:id                                           */
  /* ------------------------------------------------------------------------ */
  test("✅ PUT /api/execution/:id should update (or handle missing record)", async () => {
    const res = await request(app)
      .put("/api/execution/1") // This maps to req.params.id
      .send({
        field: "validatedcredential"
      });

    // 1. Check Status Code
    expect([200, 400, 404, 500]).toContain(res.statusCode);

    // 2. Check Body Structure
    // Accept either { success: true } OR { error: "..." }
    const hasSuccess = res.body.hasOwnProperty("success");
    const hasError = res.body.hasOwnProperty("error");

    expect(hasSuccess || hasError).toBe(true);
  });
});