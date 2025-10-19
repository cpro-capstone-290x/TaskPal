import jwt from "jsonwebtoken";
import { sql } from "../config/db.js"; // Assuming you need to fetch user details from DB

// 🚨 IMPORTANT: Replace 'YOUR_JWT_SECRET' with the actual secret you use for signing tokens
const jwtSecret = process.env.JWT_SECRET || 'JWT_SECRET';

// 1. Protection Middleware (Checks for a valid token)
export const protect = async (req, res, next) => {
    let token;

    // Check for token in the 'Authorization' header (Bearer Token format)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (format: "Bearer [TOKEN]")
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, jwtSecret);

            // Attach user data (without password) to the request object
            // This assumes the admin user details are in the 'admins' table
            const adminUser = await sql`
                SELECT id, first_name, email, role FROM admins WHERE id = ${decoded.id}
            `;

            if (adminUser.length > 0) {
                // Admin found. Attach user, and move on.
                req.adminUser = adminUser[0]; 
                return next(); // 🛑 IMPORTANT: Exit the middleware chain
            }

            // Attach user data (without password) to the request object
            // This assumes the provider user details are in the 'providers' table
            const providerUser = await sql`
                SELECT id, name, email, status FROM providers WHERE id = ${decoded.id}
            `;

            if (providerUser.length > 0) {
                // Provider found. Attach user, and move on.
                req.providerUser = providerUser[0]; 
                return next(); // 🛑 IMPORTANT: Exit the middleware chain
            }

        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
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