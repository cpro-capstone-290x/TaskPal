import { sql } from "../config/db.js";


export const getAuthorizedUsers = async (req, res) => {
    try {
        const authorizedUsers = await sql`
        SELECT * FROM authorized_users
        ORDER BY created_at DESC
        `;
        res.status(200).json({success:true, data: authorizedUsers});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch authorized users' });
    }
}
export const getauthorizeUser = async (req, res) => {
    const { id } = req.params;

  try {
    const authorized = await sql`
      SELECT * FROM authorized_users WHERE id = ${id}
    `;
    if (authorized.length === 0) {
        return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ success: true, data: authorized[0] });

  }catch (error) {
    console.error("❌ Failed to fetch user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}
export const createAuthorizedUser = async (req, res) => {
    const { client_id, first_name, last_name, email, phone, relationship } = req.body;
    if (!client_id || !first_name || !last_name || !email || !relationship) {
        return res.status(400).json({ error: 'client_id, first_name, last_name, email, and relationship are required' });
    }
    try {
        const newAuthorizedUser = await sql`
        INSERT INTO authorized_users (
            client_id, first_name, last_name, email, phone, relationship
        )
        VALUES (
            ${client_id}, ${first_name}, ${last_name}, ${email}, ${phone}, ${relationship}
        )
        RETURNING *
        `;
        console.log("✅ Created authorized user:", newAuthorizedUser[0]);
        res.status(201).json({ success: true, data: newAuthorizedUser[0] });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error("❌ Failed to create authorized user:", error);
        res.status(500).json({ error: 'Failed to create authorized user' });
    }
}
export const updateAuthorizedUser = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, phone, relationship, is_active } = req.body;
    try {
        const existingUser = await sql`
        UpDATE authorized_users
        SET
            first_name = COALESCE(${first_name}, first_name),
            last_name = COALESCE(${last_name}, last_name),
            email = COALESCE(${email}, email),
            phone = COALESCE(${phone}, phone),
            relationship = COALESCE(${relationship}, relationship),
            is_active = COALESCE(${is_active}, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
        `;
        if(updateProvider.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ success: true, data: existingUser[0] });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error("❌ Failed to update authorized user:", error);
        res.status(500).json({ error: 'Failed to update authorized user' });
    }
}
export const deleteAuthorizedUser = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedUser = await sql`
        DELETE FROM authorized_users WHERE id = ${id} RETURNING *
        `;
        if (deletedUser.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ success: true, data: deletedUser[0] });
    } catch (error) {
        console.error("❌ Failed to delete authorized user:", error);
        res.status(500).json({ error: "Failed to delete authorized user" });
    }
}