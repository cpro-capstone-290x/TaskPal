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

const controller = await import("../../controllers/executionController.js");
const { createExecutionIfMissing, updateExecutionField } = controller;

/* -------------------------------------------------------------------------- */
/* 🧪 3️⃣ Unit Test Suite                                                      */
/* -------------------------------------------------------------------------- */
describe("🧪 Execution Controller — Unit Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  /* ---------------- createExecutionIfMissing() ---------------- */
  test("✅ creates execution successfully", async () => {
    const req = { body: { booking_id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // FIX: Order must match controller logic
    // 1. Check existing execution -> Empty []
    // 2. Fetch Booking -> Found [{...}]
    // 3. Fetch Payment -> Found [{...}]
    // 4. Insert Execution -> Success [{...}]
    sqlMock
      .mockResolvedValueOnce([]) // 1. Check Execution (Empty = doesn't exist)
      .mockResolvedValueOnce([{ id: 1, client_id: 2, provider_id: 3 }]) // 2. Booking
      .mockResolvedValueOnce([{ id: 10 }]) // 3. Payment
      .mockResolvedValueOnce([{ id: 100, booking_id: 1 }]); // 4. Insert

    await createExecutionIfMissing(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(4);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test("❌ returns 400 if booking_id is missing", async () => {
    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createExecutionIfMissing(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("❌ returns 404 if booking not found", async () => {
    const req = { body: { booking_id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // Logic:
    // 1. Check Execution -> []
    // 2. Fetch Booking -> [] (Not found)
    sqlMock
        .mockResolvedValueOnce([]) // 1. Execution check
        .mockResolvedValueOnce([]); // 2. Booking check

    await createExecutionIfMissing(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("⚠️ returns existing execution if already exists", async () => {
    const req = { body: { booking_id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // Logic:
    // 1. Check Execution -> Found [{...}] -> Return immediately
    sqlMock
      .mockResolvedValueOnce([{ id: 99 }]); // 1. Existing execution

    await createExecutionIfMissing(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Already exists" })
    );
  });

  test("❌ handles DB error", async () => {
    const req = { body: { booking_id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockRejectedValueOnce(new Error("DB Error"));

    await createExecutionIfMissing(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  /* --------------------- updateExecutionField() --------------------- */
  test("✅ updates execution status", async () => {
    const req = {
      params: { bookingId: 1 },
      body: { field: "validatedcredential" },
      io: { to: jest.fn().mockReturnThis(), emit: jest.fn() }, // socket mock
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // FIX: Provide mocks for both the Update AND the Notification insert
    sqlMock
        .mockResolvedValueOnce([{ id: 1, client_id: 2, booking_id: 1 }]) // 1. Update Execution
        .mockResolvedValueOnce([{ id: 50, created_at: new Date() }]);    // 2. Insert Notification

    await updateExecutionField(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test("❌ returns 404 if execution not found", async () => {
    const req = { params: { bookingId: 99 }, body: { field: "validatedcredential" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockResolvedValueOnce([]); // Update returns empty array

    await updateExecutionField(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("❌ handles update error", async () => {
    const req = { params: { bookingId: 1 }, body: { field: "validatedcredential" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockRejectedValueOnce(new Error("DB failure"));

    await updateExecutionField(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});