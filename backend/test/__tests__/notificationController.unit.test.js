// test/__tests__/notificationController.unit.test.js
import { jest } from "@jest/globals";

/* -----------------------------------------------------------
 * 1️⃣ Mock Neon BEFORE importing controller
 * ----------------------------------------------------------- */
jest.unstable_mockModule("../../config/db.js", () => ({
  sql: jest.fn(),
}));

/* -----------------------------------------------------------
 * 2️⃣ Import controller AFTER mocks
 * ----------------------------------------------------------- */
const mockDb = await import("../../config/db.js");
const sqlMock = mockDb.sql;

const controller = await import("../../controllers/notificationController.js");
const { getNotifications, markAllAsRead, markOneAsRead } = controller;

/* -----------------------------------------------------------
 * 3️⃣ Test Suite
 * ----------------------------------------------------------- */
describe("🔔 Notification Controller — Unit Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  /* ----------------------- getNotifications ----------------------- */
  test("✅ getNotifications returns rows", async () => {
    sqlMock.mockResolvedValue([{ id: 1, message: "Test notification" }]);

    const req = { params: { userId: 1 } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getNotifications(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 1, message: "Test notification" }],
    });
  });

  test("❌ getNotifications handles DB error", async () => {
    sqlMock.mockRejectedValue(new Error("DB failed"));

    const req = { params: { userId: 1 } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
  });

  /* ------------------------ markAllAsRead ------------------------- */
  test("✅ markAllAsRead updates successfully", async () => {
    sqlMock.mockResolvedValue([]);

    const req = { params: { userId: 1 } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await markAllAsRead(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      message: "All notifications marked as read",
    });
  });

  test("❌ markAllAsRead handles DB error", async () => {
    sqlMock.mockRejectedValue(new Error("DB Error"));

    const req = { params: { userId: 1 } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await markAllAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  /* ------------------------- markOneAsRead ------------------------- */
  test("✅ markOneAsRead updates single notification", async () => {
    sqlMock.mockResolvedValue([]);

    const req = { params: { id: 10 }, user: { id: 99 } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await markOneAsRead(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      message: "Notification marked as read",
    });
  });

  test("❌ markOneAsRead handles DB error", async () => {
    sqlMock.mockRejectedValue(new Error("DB ERR"));

    const req = { params: { id: 10 }, user: { id: 99 } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await markOneAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
