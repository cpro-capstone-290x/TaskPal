import request from "supertest";
import app from "../../app.js";

describe("🔗 User Controller — Integration Tests", () => {
  
  /* -----------------------------------------------------------
   * GET /api/users
   * ----------------------------------------------------------- */
  test("GET /api/users should return all users", async () => {
    const res = await request(app).get("/api/users");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  /* -----------------------------------------------------------
   * GET /api/users/:id
   * ----------------------------------------------------------- */
  test("GET /api/users/:id should return a user or 404", async () => {
    const res = await request(app).get("/api/users/1");

    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("id");
    }
  });

  /* -----------------------------------------------------------
   * PUT /api/users/:id
   * ----------------------------------------------------------- */
  test("PUT /api/users/:id should update and return updated user", async () => {
    const payload = {
      first_name: "Updated",
      email: "updated@example.com"
    };

    const res = await request(app).put("/api/users/1").send(payload);

    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("data");
    }
  });

  /* -----------------------------------------------------------
   * DELETE /api/users/:id
   * ----------------------------------------------------------- */
  test("DELETE /api/users/:id should delete user or return 404", async () => {
    const res = await request(app).delete("/api/users/1");

    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("success", true);
    }
  });
});
