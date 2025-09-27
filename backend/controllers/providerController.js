import { sql } from "../config/db.js";

export const getProviders = async (req, res) => {
    try {
        const provider = await sql`
        SELECT * FROM providers
        ORDER BY created_at DESC
        `;
        console.log("fetched providers", provider);
        res.status(200).json({success:true, data: provider});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch providers' });
    }
}
export const getProvider = async (req, res) => {
    const { id } = req.params;

  try {
    const user = await sql`
      SELECT * FROM providers WHERE id = ${id}
    `;

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ success: true, data: user[0] });
  } catch (error) {
    console.error("❌ Failed to fetch user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}
export const createProvider = async (req, res) => {
    const { name, provider_type, service_type, license_id, email, phone, document, password } = req.body;
    if (!name || !provider_type || !service_type || !email || !password) {
        return res.status(400).json({ error: 'Name, provider_type, service_type, email, and password are required' });
    }
    try {
        const newProvider = await sql`
        INSERT INTO providers (
            name, provider_type, service_type, license_id, email, phone, document, password
        )
        VALUES (
            ${name}, ${provider_type}, ${service_type}, ${license_id}, ${email}, ${phone}, ${document}, ${password}
        )
        RETURNING *
        `;
        console.log("✅ Created provider:", newProvider[0]);
        res.status(201).json({ success: true, data: newProvider[0] });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error("❌ Failed to create provider:", error);
        res.status(500).json({ error: 'Failed to create provider' });
    }

}
export const updateProvider = async (req, res) => {
    const { id } = req.params;
    const { name, provider_type, service_type, license_id, email, phone, document, status, password } = req.body;
    try {
        const updatedProvider = await sql`
        UPDATE providers 
        SET
            name = COALESCE(${name}, name),
            provider_type = COALESCE(${provider_type}, provider_type),
            service_type = COALESCE(${service_type}, service_type),
            license_id = COALESCE(${license_id}, license_id),
            email = COALESCE(${email}, email),
            phone = COALESCE(${phone}, phone),
            document = COALESCE(${document}, document),
            status = COALESCE(${status}, status),
            password = COALESCE(${password}, password),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
        `;
        if (updatedProvider.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
        }
        res.status(200).json({ success: true, data: updatedProvider[0] });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error("❌ Failed to update provider:", error);
        res.status(500).json({ error: 'Failed to update provider' });
    }   
}
export const deleteProvider = async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await sql`
        DELETE FROM providers WHERE id = ${id} RETURNING *
        `;
        if (deleted.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
        }
        res.status(200).json({ success: true, data: deleted[0] });
    } catch (error) {
        console.error("❌ Failed to delete provider:", error);
        res.status(500).json({ error: 'Failed to delete provider' });
    }       
}