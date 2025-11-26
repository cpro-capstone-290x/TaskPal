import { jest } from "@jest/globals";

/* -------------------------------------------------------------------------- */
/* 🧩 1️⃣ Mock Neon BEFORE import                                             */
/* -------------------------------------------------------------------------- */
jest.unstable_mockModule("../../config/db.js", () => ({
  sql: jest.fn(),
}));

/* -------------------------------------------------------------------------- */
/* 🧠 2️⃣ Import Controller After Mock                                         */
/* -------------------------------------------------------------------------- */
const mockDb = await import("../../config/db.js");
const sqlMock = mockDb.sql;

const controller = await import("../../controllers/announcementController.js");
const {
  createAnnouncement,
  getActiveAnnouncement,
  getAllAnnouncements,
  activateAnnouncement,
  completeAnnouncement,
  deleteAnnouncement
} = controller;

/* -------------------------------------------------------------------------- */
/* 🧪 3️⃣ Unit Test Suite                                                      */
/* -------------------------------------------------------------------------- */
describe("🧪 Announcement Controller — Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      io: { emit: jest.fn() } // Mock Socket.IO
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    // Mock console.error to keep test output clean
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  /* ---------------- createAnnouncement ---------------- */
  test("✅ createAnnouncement success", async () => {
    req.body = { title: "Test", message: "Msg", start_at: "now", end_at: "later" };
    const mockData = { id: 1, ...req.body };

    sqlMock.mockResolvedValueOnce([mockData]);

    await createAnnouncement(req, res);

    expect(sqlMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  test("❌ createAnnouncement handles error", async () => {
    sqlMock.mockRejectedValueOnce(new Error("DB Error"));
    await createAnnouncement(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  /* ---------------- getActiveAnnouncement ---------------- */
  test("✅ getActiveAnnouncement success", async () => {
    const mockData = { id: 1, is_active: true };
    sqlMock.mockResolvedValueOnce([mockData]);

    await getActiveAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  test("✅ getActiveAnnouncement returns null if none active", async () => {
    sqlMock.mockResolvedValueOnce([]); // Empty result

    await getActiveAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: null });
  });

  /* ---------------- getAllAnnouncements ---------------- */
  test("✅ getAllAnnouncements success", async () => {
    const mockList = [{ id: 1 }, { id: 2 }];
    sqlMock.mockResolvedValueOnce(mockList);

    await getAllAnnouncements(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockList });
  });

  /* ---------------- activateAnnouncement ---------------- */
  test("✅ activateAnnouncement success + socket emit", async () => {
    req.params.id = 1;
    const mockUpdated = { id: 1, is_active: true };
    sqlMock.mockResolvedValueOnce([mockUpdated]);

    await activateAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(req.io.emit).toHaveBeenCalledWith("announcement:activated", mockUpdated);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockUpdated });
  });

  test("❌ activateAnnouncement 404", async () => {
    req.params.id = 99;
    sqlMock.mockResolvedValueOnce([]); // No update

    await activateAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* ---------------- completeAnnouncement ---------------- */
  test("✅ completeAnnouncement success + socket emit", async () => {
    req.params.id = 1;
    const mockUpdated = { id: 1, is_active: false };
    sqlMock.mockResolvedValueOnce([mockUpdated]);

    await completeAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(req.io.emit).toHaveBeenCalledWith("announcement:completed", mockUpdated);
  });

  /* ---------------- deleteAnnouncement ---------------- */
  test("✅ deleteAnnouncement success + socket emit", async () => {
    req.params.id = 1;
    const mockDeleted = { id: 1 };
    sqlMock.mockResolvedValueOnce([mockDeleted]);

    await deleteAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(req.io.emit).toHaveBeenCalledWith("announcement:deleted", 1);
  });
});