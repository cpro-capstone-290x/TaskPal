// backend/controllers/userController.js

import { sql } from "../config/db.js";
import bcrypt from "bcrypt";
import { sendOTP } from "../config/mailer.js"; // we'll make this helper
import jwt from "jsonwebtoken";

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

export const createUser = async (req, res) => {
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

  if (!first_name || !last_name || !email || !password || !type_of_user) {
    return res.status(400).json({
      error: "First name, last name, email, password, and type_of_user are required"
    });
  }

  try {
    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // generate OTP
    const otp = generateOTP();

    // insert user with OTP + hashed password
    const newUser = await sql`
      INSERT INTO users (
        first_name, last_name, type_of_user, email, password, 
        unit_no, street, city, province, postal_code,
        twofa_code, twofa_expires, is_verified
      )
      VALUES (
        ${first_name}, ${last_name}, ${type_of_user}, ${email}, ${hashed},
        ${unit_no}, ${street}, ${city}, ${province}, ${postal_code},
        ${otp}, NOW() + INTERVAL '10 minutes', false
      )
      RETURNING *
    `;

    // send OTP via Gmail
    await sendOTP(email, otp);

    res.status(201).json({
      success: true,
      message: "User registered. Please check your email for OTP.",
      data: { id: newUser[0].id, email: newUser[0].email }
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("❌ Failed to create user:", error);
    console.log(process.env.EMAIL_USER, process.env.EMAIL_PASS);
    res.status(500).json({ error: "Failed to create user" });
  }
};

// ✅ OTP verification
export const verifyUser = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await sql`SELECT * FROM users WHERE email = ${email}`;

    if (!user[0]) return res.status(404).json({ error: "User not found" });

    if (
      user[0].twofa_code !== otp ||
      new Date() > new Date(user[0].twofa_expires)
    ) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await sql`
      UPDATE users 
      SET is_verified = true, twofa_code = null, twofa_expires = null 
      WHERE email = ${email}
    `;

    res.json({ success: true, message: "Account verified successfully!" });
  } catch (error) {
    console.error("❌ Failed to verify OTP:", error);
    res.status(500).json({ error: "OTP verification failed" });
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