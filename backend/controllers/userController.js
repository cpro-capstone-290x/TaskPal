// backend/controllers/userController.js

import { sql } from "../config/db.js";
import bcrypt from "bcrypt";
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
  const { id } = req.params;
  const {
    first_name,
    last_name,
    type_of_user,
    email,
    password,
    unit_no,
    street,
    city,
    province,
    postal_code
  } = req.body;

  try {
    const updatedUser = await sql`
      UPDATE users 
      SET 
        first_name = ${first_name},
        last_name = ${last_name},
        type_of_user = ${type_of_user},
        email = ${email},
        password = ${password},
        unit_no = ${unit_no},
        street = ${street},
        city = ${city},
        province = ${province},
        postal_code = ${postal_code},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ success: true, data: updatedUser[0] });
  } catch (error) {
    console.error("❌ Failed to update user:", error);
    res.status(500).json({ error: "Failed to update user" });
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