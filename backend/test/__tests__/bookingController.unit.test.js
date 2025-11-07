import { jest } from "@jest/globals";

/* -------------------------------------------------------------------------- */
/* 🧩 1️⃣ Mock external dependencies BEFORE importing controller               */
/* -------------------------------------------------------------------------- */
jest.unstable_mockModule("../../config/db.js", () => ({
  sql: jest.fn(),
}));

jest.unstable_mockModule("@vercel/blob", () => ({
  put: jest.fn(),
}));

// Mock PDFKit (avoid real buffer generation)
jest.unstable_mockModule("pdfkit", () => ({
  default: jest.fn().mockImplementation(() => {
    const handlers = {};
    return {
      on: (event, cb) => {
        handlers[event] = cb;
        // immediately call 'end' to resolve promise instantly
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
/* 🧠 2️⃣ Import Controller AFTER mocks                                       */
/* -------------------------------------------------------------------------- */
const mockDb = await import("../../config/db.js");
const sqlMock = mockDb.sql;
const { put: putMock } = await import("@vercel/blob");

const controller = await import("../../controllers/bookingController.js");
const { bookTask, getBookingById, updateBookingPrice, agreeToPrice, downloadAgreement, cancelBooking } = controller;

/* -------------------------------------------------------------------------- */
/* 🧪 3️⃣ Unit Test Suite                                                     */
/* -------------------------------------------------------------------------- */
describe("🧪 Booking Controller — Unit Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  /* --------------------------- bookTask() --------------------------- */
  test("✅ creates a booking successfully", async () => {
    const req = {
      body: { client_id: 1, provider_id: 2, notes: "Test", scheduled_date: "2025-11-07" },
      io: { to: jest.fn().mockReturnThis(), emit: jest.fn() },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock
      .mockResolvedValueOnce([{ id: 1, client_id: 1, provider_id: 2, scheduled_date: "2025-11-07", status: "Pending" }]) // booking insert
      .mockResolvedValueOnce([]); // chat insert

    await bookTask(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("❌ returns 400 if missing fields in bookTask", async () => {
    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await bookTask(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* --------------------------- getBookingById() --------------------------- */
  test("✅ fetches booking successfully", async () => {
    const req = { params: { id: 1 }, user: { role: "admin" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    sqlMock.mockResolvedValueOnce([{ id: 1 }]);

    await getBookingById(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  test("❌ returns 404 if booking not found", async () => {
    const req = { params: { id: 99 }, user: { role: "admin" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    sqlMock.mockResolvedValueOnce([]);
    await getBookingById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  /* --------------------------- updateBookingPrice() --------------------------- */
  test("✅ updates price successfully", async () => {
    const req = { params: { id: 1 }, body: { price: 120 }, io: { to: jest.fn().mockReturnThis(), emit: jest.fn() } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    sqlMock.mockResolvedValueOnce([{ id: 1, price: 120 }]);

    await updateBookingPrice(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  /* --------------------------- agreeToPrice() --------------------------- */
  test("✅ client agrees to price", async () => {
    const req = { params: { id: 1 }, body: { role: "user" }, io: { to: jest.fn().mockReturnThis(), emit: jest.fn() } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    sqlMock
      .mockResolvedValueOnce([{ id: 1, client_id: 1, provider_id: 2 }])
      .mockResolvedValueOnce([{ id: 1, agreement_signed_by_client: true }]);
    await agreeToPrice(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  /* --------------------------- downloadAgreement() --------------------------- */
  test("✅ generates and uploads PDF", async () => {
    const req = { params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    sqlMock.mockResolvedValueOnce([
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
    ]);
    putMock.mockResolvedValueOnce({ url: "https://blob.mock/agreement.pdf" });

    await downloadAgreement(req, res);
    expect(putMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  }, 10000); // ✅ increase timeout to 10s


  /* --------------------------- cancelBooking() --------------------------- */
  test("✅ cancels booking successfully", async () => {
    const req = { params: { id: 1 }, user: { role: "user", id: 1 }, io: { to: jest.fn().mockReturnThis(), emit: jest.fn() } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    sqlMock
      .mockResolvedValueOnce([{ id: 1, client_id: 1, provider_id: 2, status: "Pending" }])
      .mockResolvedValueOnce([{ id: 1, status: "Cancelled" }]);

    await cancelBooking(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });
});
