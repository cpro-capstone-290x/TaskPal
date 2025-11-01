import jwt from "jsonwebtoken";
import { sql } from "../config/db.js"; // Assuming you need to fetch user details from DB

// 🚨 IMPORTANT: Replace 'YOUR_JWT_SECRET' with the actual secret you use for signing tokens
const jwtSecret = process.env.JWT_SECRET || 'JWT_SECRET';

// 1. Protection Middleware (Checks for a valid token)
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, jwtSecret);

    // Try to find user in all three roles
    const [adminUser] = await sql`
      SELECT id, first_name AS name, email, 'admin' AS role
      FROM admins WHERE id = ${decoded.id}
    `;
    if (adminUser) {
      req.user = adminUser;
      return next();
    }

    const [providerUser] = await sql`
      SELECT id, name, email, status, 'provider' AS role
      FROM providers WHERE id = ${decoded.id}
    `;
    if (providerUser) {
      req.user = providerUser;
      return next();
    }

    const [normalUser] = await sql`
      SELECT id, first_name AS name, email, 'user' AS role
      FROM users WHERE id = ${decoded.id}
    `;
    if (normalUser) {
      req.user = normalUser;
      return next();
    }

    return res.status(403).json({ error: "User not found or not authorized" });
  } catch (err) {
    console.error("JWT verification error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};


// 2. Admin Middleware (Checks if the user is an admin)
export const admin = (req, res, next) => {
    // This runs AFTER 'protect', so req.adminUser should exist
    if (req.adminUser && req.adminUser.role === 'admin') { // Assuming the role value is 'admin'
        next();
    } else {
        res.status(403).json({ error: 'Not authorized as an admin' });
    }
};

export const provider = (req, res, next) => {
    // This runs AFTER 'protect', so req.providerUser should exist
    if (req.providerUser && req.providerUser.status === 'Approved') { // Assuming the status value is 'Approved'
        next();
    } else {
        res.status(403).json({ error: 'Not authorized as a provider' });
    }
};
export const providerAuth = (req, res, next) => {
    // This runs AFTER 'protect', so req.providerUser should exist
    const { id } = req.params;
if (req.providerUser && String(req.providerUser.id) === String(id)) {
        next();
    } else {
        res.status(403).json({ error: 'Not authorized as this provider' });
    }
};

