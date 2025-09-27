import { sql } from "../config/db.js";

export const getAdmins = async (req, res) => {
    try {
        const admins = await sql`
        SELECT * FROM admins
        ORDER BY created_at DESC
        `;
        res.status(200).json({success:true, data: admins});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
}
export const getAdmin = async (req, res) => {
    const { id } = req.params;

  try {
    const admin = await sql`
      SELECT * FROM admins WHERE id = ${id}
    `;
    if (admin.length === 0) {
        return res.status(404).json({ error: "Admin not found" });
    }
    res.status(200).json({ success: true, data: admin[0] });
    }catch (error) {
    console.error("❌ Failed to fetch admin:", error);
    res.status(500).json({ error: "Failed to fetch admin" });
  }
}
export const createAdmin = async (req, res) => {
    const { first_name, email, password, role } = req.body;
    if (!first_name || !email || !password || !role) {
        return res.status(400).json({ error: 'first_name, email, password, and role are required' });
    }
    try {
        const newAdmin = await sql`
        INSERT INTO admins (
            first_name, email, password, role
        )
        VALUES (
            ${first_name}, ${email}, ${password}, ${role}
        )
        RETURNING *
        `;
        console.log("✅ Created admin:", newAdmin[0]);
        res.status(201).json({ success: true, data: newAdmin[0] });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Email or first_name already exists' });
        }
        console.error("❌ Failed to create admin:", error);
        res.status(500).json({ error: 'Failed to create admin' });
    }
}
export const updateAdmin = async (req, res) => {
    const { id } = req.params;
    const { first_name, email, password, role } = req.body;
    try {
        const existingAdmin = await sql`
        SELECT * FROM admins WHERE id = ${id}
        `;
        if (existingAdmin.length === 0) {
            return res.status(404).json({ error: "Admin not found" });
        }
        const updateAdmin = await sql`
        UPDATE admins
        SET
            first_name = COALESCE(${first_name}, first_name),
            email = COALESCE(${email}, email),
            password = COALESCE(${password}, password),
            role = COALESCE(${role}, role),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
        `;
        if(updateAdmin.length === 0) {
            return res.status(404).json({ error: "Admin not found" });
        }
        res.status(200).json({ success: true, data: existingAdmin[0] });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Email or first_name already exists' });
        }
        console.error("❌ Failed to update admin:", error);
        res.status(500).json({ error: 'Failed to update admin' });
    }
}
export const deleteAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const existingAdmin = await sql`
        SELECT * FROM admins WHERE id = ${id}
        `;
        if (existingAdmin.length === 0) {
            return res.status(404).json({ error: "Admin not found" });
        }
        const deletedAdmin = await sql`
        DELETE FROM admins WHERE id = ${id} RETURNING *
        `;
        res.status(200).json({ success: true, data: deletedAdmin[0] });
    } catch (error) {
        console.error("❌ Failed to delete admin:", error);
        res.status(500).json({ error: "Failed to delete admin" });
    }
}
