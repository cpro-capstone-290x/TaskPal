export const mockAuth = (req, res, next) => {
  // simulate an authenticated user
  req.user = { id: 1, role: "client" };
  next();
};
