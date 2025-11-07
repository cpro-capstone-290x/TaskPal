import { jest } from "@jest/globals";

/* -------------------------------------------------------------------------- */
/* 🧩 1️⃣ Mock Neon BEFORE import                                              */
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
const { createExecution, updateExecutionStatus } = controller;

/* -------------------------------------------------------------------------- */
/* 🧪 3️⃣ Unit Test Suite                                                      */
/* -------------------------------------------------------------------------- */
describe("🧪 Execution Controller — Unit Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  /* --------------------------- createExecution() -------------------------- */
  test("✅ creates execution successfully", async () => {
    const req = { body: { booking_id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock
      .mockResolvedValueOnce([{ id: 1, client_id: 2, provider_id: 3 }]) // bookings
      .mockResolvedValueOnce([{ id: 10 }]) // payments
      .mockResolvedValueOnce([]) // existing
      .mockResolvedValueOnce([{ id: 100, booking_id: 1 }]); // insert

    await createExecution(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(4);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining("Execution record created"),
      })
    );
  });

  test("❌ returns 400 if booking_id is missing", async () => {
    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createExecution(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("❌ returns 404 if booking not found", async () => {
    const req = { body: { booking_id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockResolvedValueOnce([]); // no booking found

    await createExecution(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("✅ returns existing execution if already exists", async () => {
    const req = { body: { booking_id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock
      .mockResolvedValueOnce([{ id: 1, client_id: 2, provider_id: 3 }]) // booking
      .mockResolvedValueOnce([{ id: 10 }]) // payment
      .mockResolvedValueOnce([{ id: 99 }]); // existing

    await createExecution(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("already exists") })
    );
  });

  test("❌ handles internal DB error gracefully", async () => {
    const req = { body: { booking_id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockRejectedValueOnce(new Error("DB Error"));
    await createExecution(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  /* ----------------------- updateExecutionStatus() ------------------------ */
  test("✅ updates execution successfully", async () => {
    const req = {
      params: { execution_id: 1 },
      body: { validatedCredential: true, completedProvider: "done", completedClient: "done" },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockResolvedValueOnce([{ id: 1, validatedCredential: true }]);

    await updateExecutionStatus(req, res);

    expect(sqlMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("updated successfully") })
    );
  });

  test("❌ returns 404 when execution not found", async () => {
    const req = {
      params: { execution_id: 99 },
      body: { validatedCredential: true },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockResolvedValueOnce([]);
    await updateExecutionStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("❌ handles update error", async () => {
    const req = { params: { execution_id: 1 }, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockRejectedValueOnce(new Error("DB failure"));
    await updateExecutionStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
