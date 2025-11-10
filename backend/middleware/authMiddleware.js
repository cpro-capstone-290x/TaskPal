import jwt from "jsonwebtoken";
import { sql } from "../config/db.js";

const jwtSecret = process.env.JWT_SECRET || "JWT_SECRET";

// ✅ 1. Protection Middleware (Checks for a valid token)
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, jwtSecret);

    // --- Check Admins table ---
    const [adminUser] = await sql`
      SELECT id, first_name AS name, email, 'admin' AS role
      FROM admins WHERE id = ${decoded.id}
    `;
    if (adminUser) {
      req.adminUser = adminUser;
      req.user = adminUser;
      return next();
    }

    // --- Check Providers table ---
    const [providerUser] = await sql`
      SELECT id, name, email, status, 'provider' AS role
      FROM providers WHERE id = ${decoded.id}
    `;
    if (providerUser) {
      req.providerUser = providerUser;
      req.user = providerUser;
      return next();
    }

    // --- Check Normal Users table ---
    const [normalUser] = await sql`
      SELECT id, first_name AS name, email, 'user' AS role
      FROM users WHERE id = ${decoded.id}
    `;
    if (normalUser) {
      req.normalUser = normalUser;
      req.user = normalUser;
      return next();
    }

    return res.status(403).json({ error: "User not found or not authorized" });
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const admin = (req, res, next) => {
    // This runs AFTER 'protect', so req.user should exist
    if (req.user && req.user.role === 'admin') { // Assuming the role value is 'admin'
        next();
    } else {
        res.status(403).json({ error: 'Not authorized as an admin' });
    }
};

// ✅ 2. Admin Middleware (renamed internally but same logic)
export const adminAuth = (req, res, next) => {
  if (
    (req.adminUser && req.adminUser.role === "admin") ||
    (req.user && req.user.role === "admin")
  ) {
    return next();
  }
  return res.status(403).json({ error: "Not authorized as an admin" });
};

// ✅ 3. Provider Middleware (checks if approved)
export const provider = (req, res, next) => {
  if (
    (req.providerUser && req.providerUser.status === "Approved") ||
    (req.user && req.user.role === "provider" && req.user.status === "Approved")
  ) {
    return next();
  }
  return res.status(403).json({ error: "Not authorized as a provider" });
};

export const user = (req, res, next) => {
    // This runs AFTER 'protect', so req.user should exist
    if (req.user && req.user.role === 'user') {
        next();
    } else {
        res.status(403).json({ error: 'Not authorized as a client' });
    }
};

// ✅ 4. ProviderAuth (self-access only)
export const providerAuth = (req, res, next) => {
  const { id } = req.params;
  if (
    (req.providerUser && String(req.providerUser.id) === String(id)) ||
    (req.user &&
      req.user.role === "provider" &&
      String(req.user.id) === String(id))
  ) {
    return next();
  }
  return res.status(403).json({ error: "Not authorized as this provider" });
};
