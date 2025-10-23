// backend/controllers/userController.js

import { sql } from "../config/db.js";
import bcrypt from "bcryptjs";
import { sendOTP } from "../config/mailer.js"; // we'll make this helper
import jwt from "jsonwebtoken";


export const getUsers = async (req, res) => {
    try {
        const users = await sql`
        SELECT * FROM users
        ORDER BY created_at DESC
        `;
        console.log("fetched users", users);
        res.status(200).json({success:true, data: users});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }   
}
export const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ success: true, data: user[0] });
  } catch (error) {
    console.error("❌ Failed to fetch user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const updateUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      unit_no,
      street,
      city,
      province,
      postal_code,
    } = req.body;

    console.log("Updating user:", id, req.body);

    const updated = await sql`
      UPDATE users
      SET
        first_name = ${first_name},
        last_name = ${last_name},
        email = ${email},
        unit_no = ${unit_no},
        street = ${street},
        city = ${city},
        province = ${province},
        postal_code = ${postal_code}
      WHERE id = ${id}
      RETURNING *;
    `;

    if (updated.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error("Error updating user:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to update user" });
  }
};

export const deleteUsers = async (req, res) => {
    const { id } = req.params;

  try {
    const deleted = await sql`
      DELETE FROM users WHERE id = ${id} RETURNING *
    `;

    if (deleted.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: `User ${id} deleted`, data: deleted[0] });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
}