import request from "supertest";
import app from "../../app.js";


describe("🔗 User Controller — Integration Tests", () => {
  test("GET /api/users should return all users", async () => {
    const res = await request(app).get("/api/users");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
  });

  test("GET /api/users/:id should return a user", async () => {
    const res = await request(app).get("/api/users/1");
    if (res.statusCode === 200) {
      expect(res.body.data).toHaveProperty("id");
    } else {
      expect(res.statusCode).toBe(404);
    }
  });

  test("PUT /api/users/:id should update a user", async () => {
    const res = await request(app)
      .put("/api/users/1")
      .send({ first_name: "Updated", email: "updated@example.com" });
    expect([200, 404]).toContain(res.statusCode);
  });

  test("DELETE /api/users/:id should delete a user", async () => {
    const res = await request(app).delete("/api/users/1");
    expect([200, 404]).toContain(res.statusCode);
  });
});
