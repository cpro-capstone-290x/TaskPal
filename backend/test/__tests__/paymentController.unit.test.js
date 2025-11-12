import { jest } from "@jest/globals";

/* -------------------------------------------------------------------------- */
/* 🧩 1️⃣ Mock Neon + Stripe BEFORE imports                                     */
/* -------------------------------------------------------------------------- */

// Mock Neon Database
jest.unstable_mockModule("../../config/db.js", () => ({
  sql: jest.fn(),
}));

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
/* 🧠 2️⃣ Load Mocks & Controller                                              */
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
    const req = { params: { bookingId: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockResolvedValueOnce([{ id: 1, price: 100, notes: "Test Booking" }]);
    mockCreate.mockResolvedValueOnce({ url: "https://stripe.com/session123" });

    await createPaymentIntent(req, res);

    expect(sqlMock).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ url: expect.any(String) }));
  });

  test("❌ createPaymentIntent returns 404 if booking not found", async () => {
    const req = { params: { bookingId: 999 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockResolvedValueOnce([]);
    await createPaymentIntent(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Booking not found" }));
  });

  test("❌ createPaymentIntent handles Stripe failure", async () => {
    const req = { params: { bookingId: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockResolvedValueOnce([{ id: 1, price: 100 }]);
    mockCreate.mockRejectedValueOnce(new Error("Stripe API Error"));

    await createPaymentIntent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Stripe payment failed" }));
  });

  test("✅ verifyPaymentSession returns bookingId when paid", async () => {
    const req = { params: { sessionId: "sess_123" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    mockRetrieve.mockResolvedValueOnce({
      payment_status: "paid",
      metadata: { bookingId: "10" },
    });

    await verifyPaymentSession(req, res);

    expect(mockRetrieve).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bookingId: "10" }));
  });

  test("❌ verifyPaymentSession returns 400 when unpaid", async () => {
    const req = { params: { sessionId: "sess_123" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    mockRetrieve.mockResolvedValueOnce({
      payment_status: "unpaid",
      metadata: { bookingId: "10" },
    });

    await verifyPaymentSession(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("❌ verifyPaymentSession returns 400 when missing metadata", async () => {
    const req = { params: { sessionId: "sess_123" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    mockRetrieve.mockResolvedValueOnce({
      payment_status: "paid",
      metadata: {},
    });

    await verifyPaymentSession(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("❌ verifyPaymentSession handles Stripe errors", async () => {
    const req = { params: { sessionId: "sess_999" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    mockRetrieve.mockRejectedValueOnce(new Error("Stripe Retrieve Error"));

    await verifyPaymentSession(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
