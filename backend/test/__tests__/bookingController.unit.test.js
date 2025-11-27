import { jest } from "@jest/globals";

/* -------------------------------------------------------------------------- */
/* 🧩 1️⃣ Mock External Dependencies                                           */
/* -------------------------------------------------------------------------- */

// Mock Database (Added virtual: true to fix "Cannot find module" error)
jest.unstable_mockModule("../../config/db.js", () => ({
  sql: jest.fn(),
}), { virtual: true });

// Mock Audit Logger (Added virtual: true)
jest.unstable_mockModule("../../utils/auditLogger.js", () => ({
  logAudit: jest.fn(),
}), { virtual: true });

// Mock Winston Logger (Added virtual: true)
jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}), { virtual: true });

// Mock Blob Storage
jest.unstable_mockModule("@vercel/blob", () => ({
  put: jest.fn(),
}));

// Mock PDFKit
jest.unstable_mockModule("pdfkit", () => ({
  default: jest.fn().mockImplementation(() => {
    const handlers = {};
    return {
      on: (event, cb) => {
        handlers[event] = cb;
        // Simulate end event immediately for async flows
        if (event === "end") setTimeout(cb, 0);
      },
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      end: jest.fn(() => {
        if (handlers["end"]) handlers["end"]();
      }),
    };
  }),
}));

/* -------------------------------------------------------------------------- */
/* 🧠 2️⃣ Import Controller & Mocks                                            */
/* -------------------------------------------------------------------------- */

// NOTE: We import these using the same paths we mocked
const mockDb = await import("../../config/db.js");
const sqlMock = mockDb.sql;
const { put: putMock } = await import("@vercel/blob");

// Import Controller
const controller = await import("../../controllers/bookingController.js");
const { 
  bookTask, 
  getBookingById, 
  updateBookingPrice, 
  agreeToPrice, 
  downloadAgreement, 
  cancelBooking 
} = controller;

/* -------------------------------------------------------------------------- */
/* 🧪 3️⃣ Unit Test Suite                                                      */
/* -------------------------------------------------------------------------- */

describe("🧪 Booking Controller — Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* --------------------------- bookTask() --------------------------- */
  test("✅ creates a booking successfully", async () => {
    const req = {
      body: { client_id: 1, provider_id: 2, notes: "Test", scheduled_date: "2025-11-07", price: 100 },
      io: { to: jest.fn().mockReturnThis(), emit: jest.fn() },
      headers: {}, // Prevent 'cannot read x-request-id' error
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // MOCK RESPONSES FOR 3 SQL CALLS:
    sqlMock
      .mockResolvedValueOnce([{ id: 1, client_id: 1, provider_id: 2, scheduled_date: "2025-11-07", status: "Pending", price: 100 }]) // 1. Booking Insert
      .mockResolvedValueOnce([]) // 2. Chat Init
      .mockResolvedValueOnce([]); // 3. Notification Insert

    await bookTask(req, res);

    // Expect 3 calls: Booking + Chat + Notification (Audit is mocked out)
    expect(sqlMock).toHaveBeenCalledTimes(3); 
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bookingId: 1 }));
  });

  test("❌ returns 400 if missing fields in bookTask", async () => {
    const req = { body: {}, headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    await bookTask(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* --------------------------- getBookingById() --------------------------- */
  test("✅ fetches booking successfully", async () => {
    const req = { 
      params: { id: 1 }, 
      user: { id: 1, role: "user" },
      headers: {} 
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    sqlMock.mockResolvedValueOnce([{ id: 1, client_id: 1, provider_id: 2 }]);

    await getBookingById(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  test("❌ returns 404 if booking not found", async () => {
    const req = { 
        params: { id: 99 }, 
        user: { id: 1, role: "user" },
        headers: {} 
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    sqlMock.mockResolvedValueOnce([]); // No result
    await getBookingById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* --------------------------- updateBookingPrice() --------------------------- */
  test("✅ updates price successfully", async () => {
    const req = { 
      params: { id: 1 }, 
      body: { price: 120 }, 
      user: { id: 2, role: "provider" },
      io: { to: jest.fn().mockReturnThis(), emit: jest.fn() },
      headers: {}
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    sqlMock
        .mockResolvedValueOnce([{ id: 1, price: 120, client_id: 1, provider_id: 2 }]) // Update Booking
        .mockResolvedValueOnce([]); // Notification

    await updateBookingPrice(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  /* --------------------------- agreeToPrice() --------------------------- */
  test("✅ client agrees to price", async () => {
    const req = { 
      params: { id: 1 }, 
      body: { role: "user" }, 
      user: { id: 1, role: "user" },
      io: { to: jest.fn().mockReturnThis(), emit: jest.fn() },
      headers: {}
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    sqlMock
      .mockResolvedValueOnce([{ id: 1, client_id: 1, provider_id: 2 }]) // Fetch
      .mockResolvedValueOnce([{ id: 1, client_id: 1, provider_id: 2, agreement_signed_by_client: true }]) // Update
      .mockResolvedValueOnce([]); // Notification

    await agreeToPrice(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  /* --------------------------- downloadAgreement() --------------------------- */
  test("✅ generates and uploads PDF", async () => {
    const req = { 
        params: { id: 1 },
        user: { id: 1, role: "user" },
        headers: {}
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    sqlMock
        .mockResolvedValueOnce([
          {
            id: 1,
            client_id: 1,
            provider_id: 2,
            price: 100,
            notes: "ok",
            agreement_signed_by_client: true,
            agreement_signed_by_provider: true,
            scheduled_date: "2025-11-07",
            status: "Confirmed",
          },
        ]) // Fetch
        .mockResolvedValueOnce([]); // Update DB with PDF URL

    putMock.mockResolvedValueOnce({ url: "https://blob.mock/agreement.pdf" });

    await downloadAgreement(req, res);
    expect(putMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  }, 10000); 

  /* --------------------------- cancelBooking() --------------------------- */
  test("✅ cancels booking successfully", async () => {
    const req = { 
      params: { id: 1 }, 
      user: { role: "user", id: 1 }, 
      io: { to: jest.fn().mockReturnThis(), emit: jest.fn() },
      headers: {}
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    sqlMock
      .mockResolvedValueOnce([{ id: 1, client_id: 1, provider_id: 2, status: "Pending" }]) // Fetch
      .mockResolvedValueOnce([{ id: 1, status: "Cancelled" }]) // Update
      .mockResolvedValueOnce([]); // Notification

    await cancelBooking(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });
});