import { jest } from "@jest/globals";

// 🧩 Mock the Neon SQL client before importing controller
jest.unstable_mockModule("../../config/db.js", () => ({
  sql: jest.fn(),
}));

const mockDb = await import("../../config/db.js");
const sqlMock = mockDb.sql;

// ✅ Import controller after mock setup
const reviewController = await import("../../controllers/reviewController.js");
const { createReview, getReviewByBooking, getReviewsByProvider } = reviewController;

describe("🧪 Review Controller — Unit Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  test("✅ createReview inserts new review successfully", async () => {
    const req = {
      user: { id: 1 },
      body: {
        booking_id: 1,
        provider_id: 2,
        rating: 5,
        comment: "Great service!",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock
      .mockResolvedValueOnce([{ id: 1, client_id: 1 }]) // booking exists
      .mockResolvedValueOnce([{ completedprovider: "completed", completedclient: "completed" }]) // execution done
      .mockResolvedValueOnce([]) // no existing review
      .mockResolvedValueOnce([{ id: 99, rating: 5, comment: "Great service!" }]); // inserted

    await createReview(req, res);

    expect(sqlMock).toHaveBeenCalledTimes(4);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test("❌ createReview returns 400 when missing fields", async () => {
    const req = { user: { id: 1 }, body: { provider_id: 2 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("❌ createReview returns 403 if booking not owned", async () => {
    const req = { user: { id: 1 }, body: { booking_id: 1, provider_id: 2, rating: 4 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock.mockResolvedValueOnce([]); // no booking found
    await createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("❌ createReview returns 400 if execution not completed", async () => {
    const req = { user: { id: 1 }, body: { booking_id: 1, provider_id: 2, rating: 4 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    sqlMock
      .mockResolvedValueOnce([{ id: 1 }]) // booking ok
      .mockResolvedValueOnce([{ completedprovider: "pending", completedclient: "completed" }]);

    await createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("✅ getReviewByBooking returns review", async () => {
    const req = { params: { bookingId: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    sqlMock.mockResolvedValueOnce([{ id: 1, rating: 5 }]);

    await getReviewByBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("❌ getReviewByBooking returns 404 if not found", async () => {
    const req = { params: { bookingId: 999 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    sqlMock.mockResolvedValueOnce([]);

    await getReviewByBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("✅ getReviewsByProvider returns list", async () => {
    const req = { params: { providerId: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    sqlMock.mockResolvedValueOnce([{ id: 1, rating: 5, reviewer_name: "John" }]);

    await getReviewsByProvider(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
