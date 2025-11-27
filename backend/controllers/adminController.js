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

// A. Get List of Providers Awaiting Review
export const getPendingProviders = async (req, res) => {
    try {
        const pendingProviders = await sql`
            SELECT 
                id, 
                name, 
                provider_type, 
                service_type, 
                email, 
                phone, 
                created_at,
                profile_picture_url
            FROM providers
            WHERE status = 'Pending' 
            ORDER BY created_at ASC
        `;
        res.status(200).json({ success: true, data: pendingProviders });
    } catch (error) {
        console.error("❌ Failed to fetch pending providers:", error);
        res.status(500).json({ error: 'Failed to fetch pending providers' });
    }
}

export const getAllProviders = async (req, res) => {
    try {
        const providers = await sql`
            SELECT * FROM providers
            ORDER BY created_at DESC
        `;
        res.status(200).json({ success: true, data: providers });
    } catch (error) {
        console.error("❌ Failed to fetch provider directory:", error);
        res.status(500).json({ error: 'Failed to fetch provider directory' });
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const users = await sql`
            SELECT * FROM users
            ORDER BY created_at DESC
        `;
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("❌ Failed to fetch user directory:", error);
        res.status(500).json({ error: 'Failed to fetch user directory' });
    }
}

export const getAllBookings = async (req, res) => {
    try {
        // ⬇️ UPDATED: We use CONCAT to join first and last name safely.
        // We also check if providers use name or first_name (I included a fallback for providers just in case).
        const bookings = await sql`
            SELECT 
                b.*,
                TRIM(CONCAT(u.first_name, ' ', u.last_name)) as client_name,
                u.email as client_email,
                p.name as provider_name, 
                p.email as provider_email
            FROM bookings b
            LEFT JOIN users u ON b.client_id = u.id
            LEFT JOIN providers p ON b.provider_id = p.id
            ORDER BY b.created_at DESC
        `;
        
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error("❌ Failed to fetch bookings:", error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
}

// F. Get Dashboard Counts (Fast)
export const getDashboardStats = async (req, res) => {
    try {
        // We use destructuring [var] to get the first row immediately.
        // The result is an object: { count: '5' }
        const [pendingData] = await sql`SELECT COUNT(*) FROM providers WHERE status = 'Pending'`;
        const [providerData] = await sql`SELECT COUNT(*) FROM providers`;
        const [userData] = await sql`SELECT COUNT(*) FROM users`;
        const [bookingData] = await sql`SELECT COUNT(*) FROM bookings`;

        res.status(200).json({
            success: true,
            data: {
                // accessing .count directly on the object (not [0].count)
                pending_providers: Number(pendingData.count),
                total_providers: Number(providerData.count),
                total_clients: Number(userData.count),
                total_bookings: Number(bookingData.count)
            }
        });
    } catch (error) {
        console.error("❌ Failed to fetch dashboard stats:", error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
}

// B. Get Full Details of a Single Provider for Review
export const getProviderForAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch ALL data, including sensitive documents/license_id for Admin review
        const provider = await sql`
            SELECT * FROM providers WHERE id = ${id}
        `;

        if (provider.length === 0) {
            return res.status(404).json({ error: "Provider not found" });
        }
        res.status(200).json({ success: true, data: provider[0] });
    } catch (error) {
        console.error("❌ Failed to fetch provider for admin review:", error);
        res.status(500).json({ error: "Failed to fetch provider" });
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
