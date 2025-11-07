import { jest } from "@jest/globals";

/* -------------------------------------------------------------------------- */
/* 🧩 1️⃣ Setup module mocks BEFORE importing the controller                    */
/* -------------------------------------------------------------------------- */
jest.unstable_mockModule("../../config/db.js", () => ({
  sql: jest.fn(),
}));

jest.unstable_mockModule("@vercel/blob", () => ({
  put: jest.fn(),
  del: jest.fn(),
}));

/* -------------------------------------------------------------------------- */
/* 🧠 2️⃣ Lazy-load everything AFTER mocks are ready                            */
/* -------------------------------------------------------------------------- */
describe("🧪 User Controller — Unit Tests", () => {
  let sqlMock, putMock, delMock;
  let getUser, getUsers, updateUsers, deleteUsers, uploadProfilePicture, getPublicUserById;

  beforeAll(async () => {
    // Import mocked modules first
    const mockDb = await import("../../config/db.js");
    const mockBlob = await import("@vercel/blob");

    sqlMock = mockDb.sql;
    putMock = mockBlob.put;
    delMock = mockBlob.del;

    // Import the controller after mocks are registered
    const controller = await import("../../controllers/userController.js");
    ({
      getUser,
      getUsers,
      updateUsers,
      deleteUsers,
      uploadProfilePicture,
      getPublicUserById,
    } = controller);

    // 🧹 Silence real console logs from controller
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  beforeEach(() => jest.clearAllMocks());

  /* -------------------------------------------------------------------------- */
  /* ✅ 3️⃣ Tests                                                              */
  /* -------------------------------------------------------------------------- */

  test("✅ getUsers should return list of users", async () => {
    sqlMock.mockResolvedValue([{ id: 1, email: "john@example.com" }]);
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getUsers(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("✅ getUser should return single user", async () => {
    sqlMock.mockResolvedValue([{ id: 1, first_name: "John" }]);
    const req = { params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getUser(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ getUser returns 404 if not found", async () => {
    sqlMock.mockResolvedValue([]);
    const req = { params: { id: 99 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getUser(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("✅ updateUsers should update and return updated user", async () => {
    sqlMock.mockResolvedValue([{ id: 1, first_name: "John" }]);
    const req = {
      params: { id: 1 },
      body: { first_name: "John", last_name: "Doe", email: "john@ex.com" },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await updateUsers(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("✅ deleteUsers should delete user", async () => {
    sqlMock.mockResolvedValue([{ id: 1 }]);
    const req = { params: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await deleteUsers(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("✅ uploadProfilePicture uploads new and updates DB", async () => {
    const req = {
      params: { id: 1 },
      file: { buffer: Buffer.from("fake-image"), mimetype: "image/jpeg" },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    sqlMock
      .mockResolvedValueOnce([{ first_name: "John", profile_picture: "old.jpg" }]) // initial fetch
      .mockResolvedValueOnce([{ id: 1, profile_picture: "https://vercel-storage.com/newpic.jpg" }]); // updated
    putMock.mockResolvedValue({ url: "https://vercel-storage.com/newpic.jpg" });

    await uploadProfilePicture(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(2);
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("✅ getPublicUserById should return safe public data", async () => {
    sqlMock.mockResolvedValue([
      { id: 1, first_name: "John", last_name: "Doe", profile_picture: null },
    ]);
    const req = { params: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getPublicUserById(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Object) }));
  });
});