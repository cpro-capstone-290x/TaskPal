import { jest } from "@jest/globals";

/* -------------------------------------------------------------------------- */
/* 🧩 1️⃣ Mock Neon + Stripe BEFORE imports                                   */
/* -------------------------------------------------------------------------- */

// Mock Neon Database
jest.unstable_mockModule("../../config/db.js", () => ({
  sql: jest.fn(),
}), { virtual: true }); // Added virtual: true for safety

// Mock Audit Logger
jest.unstable_mockModule("../../utils/auditLogger.js", () => ({
  logAudit: jest.fn(),
}), { virtual: true });

// Mock Winston Logger (to silence console noise)
jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}), { virtual: true });

// Mock Stripe SDK
jest.unstable_mockModule("stripe", () => {
  const mockCreate = jest.fn();
  const mockRetrieve = jest.fn();

  const mockCheckout = {
    sessions: { create: mockCreate, retrieve: mockRetrieve },
  };

  return {
    default: jest.fn(() => ({ checkout: mockCheckout })),
  };
});

/* -------------------------------------------------------------------------- */
/* 🧠 2️⃣ Load Mocks & Controller                                            */
/* -------------------------------------------------------------------------- */
const mockDb = await import("../../config/db.js");
const sqlMock = mockDb.sql;

const mockStripe = await import("stripe");
const stripeMock = new mockStripe.default();
const mockCreate = stripeMock.checkout.sessions.create;
const mockRetrieve = stripeMock.checkout.sessions.retrieve;

// Import controller AFTER mocks
const paymentController = await import("../../controllers/paymentController.js");
const { createPaymentIntent, verifyPaymentSession } = paymentController;

/* -------------------------------------------------------------------------- */
/* 🧪 3️⃣ Unit Test Suite                                                      */
/* -------------------------------------------------------------------------- */
describe("🧪 Payment Controller — Unit Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  test("✅ createPaymentIntent creates a session successfully", async () => {
    const req = { params: { bookingId: 1 }, headers: {} }; 
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockResolvedValueOnce([{ id: 1, price: 100, notes: "Test Booking", client_id: 1, provider_id: 2 }]);
    mockCreate.mockResolvedValueOnce({ url: "https://stripe.com/session123", id: "sess_123" });

    await createPaymentIntent(req, res);

    expect(sqlMock).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ url: expect.any(String) }));
  });

  test("❌ createPaymentIntent returns 404 if booking not found", async () => {
    const req = { params: { bookingId: 999 }, headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockResolvedValueOnce([]);
    await createPaymentIntent(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Booking not found" }));
  });

  test("❌ createPaymentIntent handles Stripe failure", async () => {
    const req = { params: { bookingId: 1 }, headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockResolvedValueOnce([{ id: 1, price: 100 }]);
    mockCreate.mockRejectedValueOnce(new Error("Stripe API Error"));

    await createPaymentIntent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Stripe payment failed" }));
  });

  /* --------------------------- verifyPaymentSession --------------------------- */

  test("✅ verifyPaymentSession returns bookingId when paid", async () => {
    const req = { params: { sessionId: "sess_123" }, headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // 1. Mock Stripe Success
    mockRetrieve.mockResolvedValueOnce({
      payment_status: "paid",
      metadata: { bookingId: "10" },
      payment_intent: "pi_123",
      amount_total: 5000,
    });

    // 2. Mock SQL Calls (Sequence matters!)
    sqlMock
      .mockResolvedValueOnce([{ id: 10, client_id: 1, provider_id: 2 }]) // Fetch Booking
      .mockResolvedValueOnce([]) // Check if Payment Exists (Empty = New Payment)
      .mockResolvedValueOnce([{ id: 1 }]) // Insert Payment
      .mockResolvedValueOnce([]); // Update Booking Status

    await verifyPaymentSession(req, res);

    expect(mockRetrieve).toHaveBeenCalled();
    // Verify successful response contains bookingId
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bookingId: "10" }));
  });

  test("❌ verifyPaymentSession returns 400 when unpaid", async () => {
    const req = { params: { sessionId: "sess_123" }, headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    mockRetrieve.mockResolvedValueOnce({
      payment_status: "unpaid",
      metadata: { bookingId: "10" },
    });

    await verifyPaymentSession(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("❌ verifyPaymentSession returns 400 when missing metadata", async () => {
    const req = { params: { sessionId: "sess_123" }, headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    mockRetrieve.mockResolvedValueOnce({
      payment_status: "paid",
      metadata: {},
    });

    await verifyPaymentSession(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("❌ verifyPaymentSession handles Stripe errors", async () => {
    const req = { params: { sessionId: "sess_999" }, headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    mockRetrieve.mockRejectedValueOnce(new Error("Stripe Retrieve Error"));

    await verifyPaymentSession(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});