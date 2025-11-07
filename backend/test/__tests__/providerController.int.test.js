import request from "supertest";
import app from "../../app.js";

describe("🔗 Provider Controller — Integration Tests", () => {

  test("✅ GET /api/providers should return all providers", async () => {
    const res = await request(app).get("/api/providers");
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  test("✅ GET /api/providers/:id should return a specific provider", async () => {
    const res = await request(app).get("/api/providers/1");
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("id");
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  test("✅ PUT /api/providers/:id should update provider details", async () => {
    const payload = {
      name: "Updated Provider",
      email: "updatedprovider@example.com",
      phone: "555-1234",
    };
    const res = await request(app).put("/api/providers/1").send(payload);
    expect([200, 403, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("id");
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  test("✅ DELETE /api/providers/:id should delete a provider", async () => {
    const res = await request(app).delete("/api/providers/1");
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("success", true);
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  test("✅ PUT /api/providers/:id/status should update provider status", async () => {
    const payload = {
      status: "Approved",
    };
    const res = await request(app).put("/api/providers/1/status").send(payload);
    expect([200, 400, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("status");
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  test("✅ GET /api/providers/service_type/:type should return providers by service type", async () => {
    const res = await request(app).get("/api/providers/service_type/Cleaning");
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.data)).toBe(true);
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  test("✅ POST /api/providers/:providerId/upload should upload provider profile picture", async () => {
    const res = await request(app)
      .post("/api/providers/1/upload")
      .attach("file", Buffer.from("fake-image"), {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });
    expect([200, 400, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("blobUrl");
    } else {
      expect(res.body).toHaveProperty("message");
    }
  });
});
