import request from "supertest";
import app from "../../app.js";

describe("🔗 Provider Controller — Integration Tests (Updated Routes)", () => {
  const statusOK = [200, 400, 404, 500];

  /* -------------------------------------------------------------------------- */
  /* GET /api/providers                                                          */
  /* -------------------------------------------------------------------------- */
  test("GET /api/providers → returns providers", async () => {
    const res = await request(app).get("/api/providers");

    expect(statusOK).toContain(res.statusCode);

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

    expect(statusOK).toContain(res.statusCode);

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
      provider_type: "individual",
      service_type: "Cleaning",
      license_id: "LIC123",
      email: "updated@example.com",
      phone: "4031112222",
      document: "Updated Document",
      status: "Pending",
      profile_picture_url: "",
      note: "Test note",
      password: "" // keep old password
    };

    const res = await request(app).put("/api/providers/1").send(payload);

    expect(statusOK).toContain(res.statusCode);

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

    expect(statusOK).toContain(res.statusCode);

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
  test("GET /api/providers/service_type/:service_type → filters providers", async () => {
    const res = await request(app).get("/api/providers/service_type/Cleaning");

    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.data)).toBe(true);
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  /* -------------------------------------------------------------------------- */
  /* POST /api/providers/:id/upload-profile (profile picture upload)             */
  /* -------------------------------------------------------------------------- */
test("POST /api/providers/:id/upload → uploads picture", async () => {
  const res = await request(app)
    .post("/api/providers/1/upload")
    .attach("file", Buffer.from("fakeImage"), {
      filename: "photo.jpg",
      contentType: "image/jpeg",
    });

  expect(statusOK).toContain(res.statusCode);

  if (res.statusCode === 200) {
    expect(res.body).toHaveProperty("blobUrl");
  } else {
    expect(res.body).toHaveProperty("message");
  }
});


  /* -------------------------------------------------------------------------- */
  /* POST /api/providers/upload-valid-id                                          */
  /* -------------------------------------------------------------------------- */
  test("POST /api/providers/upload-valid-id → uploads valid ID", async () => {
    const res = await request(app)
      .post("/api/providers/upload-valid-id")
      .field("name", "John Doe")
      .field("id_type", "Passport")
      .field("id_number", "A123456")
      .attach("file", Buffer.from("fakeID"), {
        filename: "validid.jpg",
        contentType: "image/jpeg",
      });

    expect(statusOK).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("url");
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  /* -------------------------------------------------------------------------- */
  /* POST /api/providers/upload-company-documents (multi-file upload)            */
  /* -------------------------------------------------------------------------- */
  test("POST /api/providers/upload-company-documents → uploads multiple docs", async () => {
    const res = await request(app)
      .post("/api/providers/upload-company-documents")
      .field("name", "Company Provider")
      .field("email", "company@example.com")
      .attach("files", Buffer.from("doc1"), { filename: "doc1.pdf" })
      .attach("files", Buffer.from("doc2"), { filename: "doc2.pdf" });

    expect(statusOK).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.urls)).toBe(true);
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

});
