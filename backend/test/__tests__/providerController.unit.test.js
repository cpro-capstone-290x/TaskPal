import { jest } from "@jest/globals";

/* -------------------------------------------------------------------------- */
/* 🧩 1️⃣ Mock Neon & Blob BEFORE import                                       */
/* -------------------------------------------------------------------------- */
jest.unstable_mockModule("../../config/db.js", () => ({
  sql: jest.fn(),
}));

jest.unstable_mockModule("@vercel/blob", () => ({
  put: jest.fn(),
  del: jest.fn(),
}));

/* -------------------------------------------------------------------------- */
/* 🧪 Provider Controller Tests                                                */
/* -------------------------------------------------------------------------- */
describe("🧪 Provider Controller — Unit Tests (Updated)", () => {
  let sqlMock, putMock, delMock;
  let controller;

  beforeAll(async () => {
    const mockDb = await import("../../config/db.js");
    const mockBlob = await import("@vercel/blob");

    sqlMock = mockDb.sql;
    putMock = mockBlob.put;
    delMock = mockBlob.del;

    controller = await import("../../controllers/providerController.js");

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => jest.clearAllMocks());

  /* -------------------------------------------------------------------------- */
  /* ✅ getProviders                                                            */
  /* -------------------------------------------------------------------------- */
  test("✅ getProviders returns provider list", async () => {
    sqlMock.mockResolvedValue([{ id: 1, name: "Test Provider" }]);

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.getProviders(req, res);

    expect(sqlMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  /* -------------------------------------------------------------------------- */
  /* ✅ getProvider                                                             */
  /* -------------------------------------------------------------------------- */
  test("✅ getProvider returns provider", async () => {
    sqlMock.mockResolvedValue([{ id: 1, name: "Provider A" }]);

    const req = { params: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.getProvider(req, res);

    expect(sqlMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("❌ getProvider 404 when missing", async () => {
    sqlMock.mockResolvedValue([]);

    const req = { params: { id: 999 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.getProvider(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* -------------------------------------------------------------------------- */
  /* ✅ updateProvider                                                          */
  /* -------------------------------------------------------------------------- */
  test("✅ updateProvider updates fields", async () => {
    sqlMock
      .mockResolvedValueOnce([{ password: "oldhash" }]) // SELECT password
      .mockResolvedValueOnce([{ id: 1, name: "Updated Provider" }]); // UPDATE

    const req = {
      params: { id: 1 },
      body: {
        name: "Updated Provider",
        email: "updated@email.com",
        password: "", // keep old password
      },
    };

    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.updateProvider(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("❌ updateProvider returns 404 when provider missing", async () => {
    sqlMock.mockResolvedValueOnce([]); // No provider found

    const req = { params: { id: 1 }, body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.updateProvider(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* -------------------------------------------------------------------------- */
  /* ✅ deleteProvider                                                          */
  /* -------------------------------------------------------------------------- */
  test("✅ deleteProvider works", async () => {
    sqlMock.mockResolvedValue([{ id: 1 }]);

    const req = { params: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.deleteProvider(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ deleteProvider returns 404 when missing", async () => {
    sqlMock.mockResolvedValue([]);

    const req = { params: { id: 99 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.deleteProvider(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* -------------------------------------------------------------------------- */
  /* ✅ updateProviderStatus                                                    */
  /* -------------------------------------------------------------------------- */
  test("✅ updateProviderStatus works", async () => {
    sqlMock.mockResolvedValue([{ id: 1, status: "Approved" }]);

    const req = { params: { id: 1 }, body: { status: "Approved" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.updateProviderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ updateProviderStatus requires rejection reason", async () => {
    const req = { params: { id: 1 }, body: { status: "Rejected" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.updateProviderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* -------------------------------------------------------------------------- */
  /* ✅ getProvidersByServiceType                                               */
  /* -------------------------------------------------------------------------- */
  test("✅ getProvidersByServiceType works", async () => {
    sqlMock.mockResolvedValue([{ id: 1, service_type: "Cleaning" }]);

    const req = { params: { service_type: "Cleaning" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.getProvidersByServiceType(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ getProvidersByServiceType returns 404 when empty", async () => {
    sqlMock.mockResolvedValue([]);

    const req = { params: { service_type: "Cleaning" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.getProvidersByServiceType(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* -------------------------------------------------------------------------- */
  /* ✅ uploadProviderProfilePicture                                            */
  /* -------------------------------------------------------------------------- */
  test("✅ uploadProviderProfilePicture uploads correctly", async () => {
    sqlMock.mockResolvedValueOnce([{ id: 1, name: "Test Provider", profile_picture_url: null }]);
    sqlMock.mockResolvedValueOnce([]); // UPDATE provider after upload

    putMock.mockResolvedValue({ url: "https://vercel-storage.com/profile.jpg" });

    const req = {
      params: { id: 1 },
      file: {
        buffer: Buffer.from("fake"),
        mimetype: "image/jpeg",
        originalname: "photo.jpg",
      },
    };

    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.uploadProviderProfilePicture(req, res);

    expect(putMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, blobUrl: expect.any(String) })
    );
  });

  test("❌ uploadProviderProfilePicture returns 400 with no file", async () => {
    const req = { params: { id: 1 }, file: null };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.uploadProviderProfilePicture(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* -------------------------------------------------------------------------- */
  /* ✅ uploadValidId                                                            */
  /* -------------------------------------------------------------------------- */
  test("✅ uploadValidId uploads valid ID", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test";

    putMock.mockResolvedValue({ url: "https://vercel-storage.com/id.jpg" });

    const req = {
      file: { buffer: Buffer.from("fake"), mimetype: "image/jpeg", originalname: "id.jpg" },
      body: { name: "John Doe", id_type: "Passport", id_number: "12345" },
    };

    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.uploadValidId(req, res);

    expect(putMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("❌ uploadValidId returns 400 without file", async () => {
    const req = { file: null, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.uploadValidId(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
