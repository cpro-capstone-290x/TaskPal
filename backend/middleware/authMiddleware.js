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
            const user = await sql`
                SELECT id, first_name, email, role FROM admins WHERE id = ${decoded.id}
            `;

            if (user.length === 0) {
                return res.status(401).json({ error: 'Not authorized, admin not found' });
            }

            req.user = user[0]; // Attach the authenticated admin user to the request
            next();

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
    // This runs AFTER 'protect', so req.user should exist
    if (req.user && req.user.role === 'admin') { // Assuming the role value is 'admin'
        next();
    } else {
        res.status(403).json({ error: 'Not authorized as an admin' });
    }
};