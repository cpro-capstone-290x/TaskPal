// backend/controllers/userController.js

import { sql } from "../config/db.js";
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
    const {    first_name,last_name,type_of_user,email,password,unit_no,street,city,province,postal_code} = req.body;
if (!first_name || !last_name || !email || !password || !type_of_user) {
    return res.status(400).json({
      error: "First name, last name, email, password, and type_of_user are required"
    });
  }

    try {
        const newUser = await sql`
        INSERT INTO users (
            first_name, last_name, type_of_user, email, password, unit_no, street, city, province, postal_code
        )
        VALUES (
            ${first_name}, ${last_name}, ${type_of_user}, ${email}, ${password},
            ${unit_no}, ${street}, ${city}, ${province}, ${postal_code}
        )
        RETURNING *
        `;

        console.log("✅ Created user:", newUser[0]);
        res.status(201).json({ success: true, data: newUser[0] });
    } catch (error) {
    if (error.code === "23505") {
      // unique violation (email already exists)
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("❌ Failed to create user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }  
}
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