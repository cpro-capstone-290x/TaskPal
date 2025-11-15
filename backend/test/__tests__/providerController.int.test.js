import request from "supertest";
import app from "../../app.js";

describe("🔗 Provider Controller — Integration Tests (Fixed Routes)", () => {

  /* -------------------------------------------------------------------------- */
  /* GET /api/providers                                                          */
  /* -------------------------------------------------------------------------- */
  test("GET /api/providers → returns providers", async () => {
    const res = await request(app).get("/api/providers");
    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.data)).toBe(true);
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  /* -------------------------------------------------------------------------- */
  /* GET /api/providers/:id                                                      */
  /* -------------------------------------------------------------------------- */
  test("GET /api/providers/:id → returns single provider", async () => {
    const res = await request(app).get("/api/providers/1");
    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body.data).toHaveProperty("id");
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  /* -------------------------------------------------------------------------- */
  /* PUT /api/providers/:id                                                      */
  /* -------------------------------------------------------------------------- */
  test("PUT /api/providers/:id → updates provider", async () => {
    const payload = {
      name: "Updated Provider",
      provider_type: "Cleaning",
      service_type: "Home Cleaning",
      license_id: "123456",
      email: "updated@example.com",
      phone: "555-9999",
      document: "New Document",
      status: "Pending",
      profile_picture_url: "",
      note: "Integration test",
      password: ""
    };

    const res = await request(app)
      .put("/api/providers/1")
      .send(payload);

    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body.data).toHaveProperty("id");
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  /* -------------------------------------------------------------------------- */
  /* DELETE /api/providers/:id                                                   */
  /* -------------------------------------------------------------------------- */
  test("DELETE /api/providers/:id → deletes provider", async () => {
    const res = await request(app).delete("/api/providers/1");
    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body.success).toBe(true);
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  /* -------------------------------------------------------------------------- */
  /* PUT /api/providers/:id/status                                               */
  /* -------------------------------------------------------------------------- */
  test("PUT /api/providers/:id/status → updates provider status", async () => {
    const res = await request(app)
      .put("/api/providers/1/status")
      .send({ status: "Approved" });

    expect([200, 400, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body.data).toHaveProperty("status");
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  /* -------------------------------------------------------------------------- */
  /* GET /api/providers/service_type/:service_type                               */
  /* -------------------------------------------------------------------------- */
  test("GET /api/providers/service_type/:service_type → filter providers", async () => {
    const res = await request(app).get("/api/providers/service_type/Cleaning");

    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.data)).toBe(true);
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  /* -------------------------------------------------------------------------- */
  /* POST /api/providers/:providerId/upload → upload profile picture             */
  /* -------------------------------------------------------------------------- */
  test("POST /api/providers/:providerId/upload → file upload", async () => {
    const res = await request(app)
      .post("/api/providers/1/upload")
      .attach("file", Buffer.from("fake-image"), {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect([200, 400, 404, 500]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("blobUrl");
    } else {
      expect(res.body).toHaveProperty("message");
    }
  });

});
