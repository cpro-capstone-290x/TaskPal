// __tests__/controllers/providerController.test.js
import { jest } from "@jest/globals";

/* -------------------------------------------------------------------------- */
/* 🧩 1️⃣ Mock Neon SQL and Vercel Blob BEFORE importing the controller       */
/* -------------------------------------------------------------------------- */
jest.unstable_mockModule("../../config/db.js", () => ({
  sql: jest.fn(),
}));

jest.unstable_mockModule("@vercel/blob", () => ({
  put: jest.fn(),
  del: jest.fn(),
}));

// bcrypt must be mocked because updateProvider hashes passwords
jest.unstable_mockModule("bcrypt", () => ({
  default: {
    genSalt: jest.fn().mockResolvedValue("salt"),
    hash: jest.fn().mockResolvedValue("hashed_pw"),
  },
}));

/* -------------------------------------------------------------------------- */
/* 🧩 IMPORT CONTROLLER AFTER MOCKS                                           */
/* -------------------------------------------------------------------------- */
let sqlMock, putMock, delMock, bcryptMock;
let controller;

beforeAll(async () => {
  const db = await import("../../config/db.js");
  const blob = await import("@vercel/blob");
  bcryptMock = (await import("bcrypt")).default;

  sqlMock = db.sql;
  putMock = blob.put;
  delMock = blob.del;

  controller = await import("../../controllers/providerController.js");

  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

beforeEach(() => jest.clearAllMocks());

/* ========================================================================== */
/* 📌 TEST SUITE                                                              */
/* ========================================================================== */
describe("🧪 Provider Controller — Unit Tests (Updated)", () => {
  /* -------------------------------------------------------------------------- */
  /* 1️⃣ getProviders                                                            */
  /* -------------------------------------------------------------------------- */
  test("✅ getProviders returns provider list", async () => {
    sqlMock.mockResolvedValue([{ id: 1, name: "Provider A" }]);

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.getProviders(req, res);

    expect(sqlMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  /* -------------------------------------------------------------------------- */
  /* 2️⃣ getProvider                                                             */
  /* -------------------------------------------------------------------------- */
  test("✅ getProvider returns provider", async () => {
    sqlMock.mockResolvedValue([{ id: 1, name: "Provider A" }]);

    const req = { params: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.getProvider(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("❌ getProvider returns 404", async () => {
    sqlMock.mockResolvedValue([]);

    const req = { params: { id: 999 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await controller.getProvider(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* -------------------------------------------------------------------------- */
  /* 3️⃣ updateProvider                                                          */
  /* -------------------------------------------------------------------------- */
  test("✅ updateProvider updates fields without password change", async () => {
    sqlMock
      .mockResolvedValueOnce([{ password: "old_hashed_pw" }]) // SELECT old pw
      .mockResolvedValueOnce([{ id: 1, name: "Updated Provider" }]); // UPDATE

    const req = {
      params: { id: 1 },
      body: {
        name: "Updated Provider",
        email: "updated@example.com",
        password: "", // keep old password
      },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.updateProvider(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("✅ updateProvider hashes new password", async () => {
    sqlMock
      .mockResolvedValueOnce([{ password: "old_hashed_pw" }])
      .mockResolvedValueOnce([{ id: 1 }]);

    const req = {
      params: { id: 1 },
      body: { password: "newpass123" },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.updateProvider(req, res);

    expect(bcryptMock.hash).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ updateProvider returns 404 missing provider", async () => {
    sqlMock.mockResolvedValueOnce([]);

    const req = { params: { id: 99 }, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.updateProvider(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* -------------------------------------------------------------------------- */
  /* 4️⃣ deleteProvider                                                          */
  /* -------------------------------------------------------------------------- */
  test("✅ deleteProvider works", async () => {
    sqlMock.mockResolvedValue([{ id: 1 }]);

    const req = { params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.deleteProvider(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ deleteProvider returns 404", async () => {
    sqlMock.mockResolvedValue([]);

    const req = { params: { id: 999 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.deleteProvider(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* -------------------------------------------------------------------------- */
  /* 5️⃣ updateProviderStatus                                                   */
  /* -------------------------------------------------------------------------- */
  test("❌ updateProviderStatus requires rejection_reason when Rejected/Suspended", async () => {
    const req = { params: { id: 1 }, body: { status: "Rejected" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.updateProviderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("✅ updateProviderStatus updates provider", async () => {
    sqlMock.mockResolvedValue([{ id: 1, status: "Approved" }]);

    const req = { params: { id: 1 }, body: { status: "Approved" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.updateProviderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  /* -------------------------------------------------------------------------- */
  /* 6️⃣ getProvidersByServiceType                                              */
  /* -------------------------------------------------------------------------- */
  test("✅ getProvidersByServiceType works", async () => {
    sqlMock.mockResolvedValue([{ id: 1, service_type: "Cleaning" }]);

    const req = { params: { service_type: "Cleaning" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.getProvidersByServiceType(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ getProvidersByServiceType returns 404", async () => {
    sqlMock.mockResolvedValue([]);

    const req = { params: { service_type: "Cleaning" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.getProvidersByServiceType(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* -------------------------------------------------------------------------- */
  /* 7️⃣ uploadProviderProfilePicture                                           */
  /* -------------------------------------------------------------------------- */
  test("❌ uploadProviderProfilePicture returns 400 when no file", async () => {
    const req = { params: { id: 1 }, file: null };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.uploadProviderProfilePicture(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("✅ uploadProviderProfilePicture uploads file", async () => {
    sqlMock
      .mockResolvedValueOnce([{ id: 1, name: "Test Provider", profile_picture_url: null }])
      .mockResolvedValueOnce([]); // UPDATE provider

    putMock.mockResolvedValue({ url: "https://storage.com/profile.jpg" });

    const req = {
      params: { id: 1 },
      file: {
        originalname: "photo.jpg",
        buffer: Buffer.from("123"),
        mimetype: "image/jpeg",
      },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.uploadProviderProfilePicture(req, res);

    expect(putMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  /* -------------------------------------------------------------------------- */
  /* 8️⃣ uploadValidId                                                           */
  /* -------------------------------------------------------------------------- */
  test("❌ uploadValidId — no file uploaded", async () => {
    const req = { file: null, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.uploadValidId(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("✅ uploadValidId uploads file", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "token";

    putMock.mockResolvedValue({ url: "https://storage.com/id.jpg" });

    const req = {
      file: {
        originalname: "id.jpg",
        buffer: Buffer.from("123"),
        mimetype: "image/jpeg",
      },
      body: { name: "John Doe", id_type: "Passport", id_number: "12345" },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.uploadValidId(req, res);

    expect(putMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  /* -------------------------------------------------------------------------- */
  /* 9️⃣ uploadCompanyDocuments (multi-file upload)                             */
  /* -------------------------------------------------------------------------- */
  test("❌ uploadCompanyDocuments — requires files", async () => {
    const req = { files: [], body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.uploadCompanyDocuments(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("✅ uploadCompanyDocuments uploads multiple files", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "token";

    putMock.mockResolvedValueOnce({ url: "https://storage.com/doc1.pdf" });
    putMock.mockResolvedValueOnce({ url: "https://storage.com/doc2.pdf" });

    const req = {
      files: [
        { originalname: "doc1.pdf", buffer: Buffer.from("123"), mimetype: "application/pdf" },
        { originalname: "doc2.pdf", buffer: Buffer.from("456"), mimetype: "application/pdf" },
      ],
      body: { name: "Test Provider" },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.uploadCompanyDocuments(req, res);

    expect(putMock).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, urls: expect.any(Array) })
    );
  });
});
