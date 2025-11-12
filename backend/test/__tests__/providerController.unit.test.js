import { jest } from "@jest/globals";

// 🧩 1️⃣ Mock Neon & Blob before import
jest.unstable_mockModule("../../config/db.js", () => ({
  sql: jest.fn(),
}));
jest.unstable_mockModule("@vercel/blob", () => ({
  put: jest.fn(),
  del: jest.fn(),
}));

// 🧠 2️⃣ Dynamically import after mocks
describe("🧪 Provider Controller — Unit Tests", () => {
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
  });

  beforeEach(() => jest.clearAllMocks());

  /* -------------------------------------------------------------------------- */
  /* ✅ getProviders                                                            */
  /* -------------------------------------------------------------------------- */
  test("✅ getProviders should return provider list", async () => {
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
  test("✅ getProvider should return a single provider", async () => {
    sqlMock.mockResolvedValue([{ id: 1, name: "Provider A" }]);
    const req = { params: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.getProvider(req, res);
    expect(sqlMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("❌ getProvider returns 404 if not found", async () => {
    sqlMock.mockResolvedValue([]);
    const req = { params: { id: 99 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.getProvider(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* -------------------------------------------------------------------------- */
  /* ✅ updateProvider                                                          */
  /* -------------------------------------------------------------------------- */
  test("✅ updateProvider updates valid fields", async () => {
    sqlMock.unsafe = jest.fn().mockResolvedValue([{ id: 1, name: "Updated Provider" }]);
    const req = {
      params: { id: 1 },
      user: { role: "admin" },
      body: { name: "Updated Provider", email: "test@provider.com" },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.updateProvider(req, res);
    expect(sqlMock.unsafe).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ updateProvider returns 403 for unauthorized user", async () => {
    const req = {
      params: { id: 1 },
      user: { id: 2, role: "provider" },
      body: { name: "Updated Provider" },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.updateProvider(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  /* -------------------------------------------------------------------------- */
  /* ✅ deleteProvider                                                          */
  /* -------------------------------------------------------------------------- */
  test("✅ deleteProvider removes provider", async () => {
    sqlMock.mockResolvedValue([{ id: 1 }]);
    const req = { params: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.deleteProvider(req, res);
    expect(sqlMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ deleteProvider returns 404 when not found", async () => {
    sqlMock.mockResolvedValue([]);
    const req = { params: { id: 99 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.deleteProvider(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* -------------------------------------------------------------------------- */
  /* ✅ updateProviderStatus                                                    */
  /* -------------------------------------------------------------------------- */
  test("✅ updateProviderStatus updates status", async () => {
    sqlMock.mockResolvedValue([{ id: 1, status: "Approved" }]);
    const req = { params: { id: 1 }, body: { status: "Approved" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.updateProviderStatus(req, res);
    expect(sqlMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ updateProviderStatus requires reason for Rejected", async () => {
    const req = { params: { id: 1 }, body: { status: "Rejected" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.updateProviderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* -------------------------------------------------------------------------- */
  /* ✅ getProvidersByServiceType                                               */
  /* -------------------------------------------------------------------------- */
  test("✅ getProvidersByServiceType returns data", async () => {
    sqlMock.mockResolvedValue([{ id: 1, service_type: "Cleaning" }]);
    const req = { params: { service_type: "Cleaning" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.getProvidersByServiceType(req, res);
    expect(sqlMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ getProvidersByServiceType 404 when empty", async () => {
    sqlMock.mockResolvedValue([]);
    const req = { params: { service_type: "Cleaning" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.getProvidersByServiceType(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* -------------------------------------------------------------------------- */
  /* ✅ uploadProviderProfilePicture                                            */
  /* -------------------------------------------------------------------------- */
  test("✅ uploadProviderProfilePicture uploads new file", async () => {
    sqlMock.mockResolvedValueOnce([{ id: 1, name: "Test", profile_picture_url: null }]);
    putMock.mockResolvedValue({ url: "https://vercel-storage.com/test.jpg" });

    const req = {
      params: { providerId: 1 },
      file: { buffer: Buffer.from("fake"), mimetype: "image/jpeg", originalname: "photo.jpg" },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.uploadProviderProfilePicture(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(2);
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, blobUrl: expect.stringContaining("https://") })
    );
  });

  test("❌ uploadProviderProfilePicture returns 400 if no file", async () => {
    const req = { params: { providerId: 1 }, file: null };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.uploadProviderProfilePicture(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
