import { sql } from "../config/db.js";
import bcrypt from "bcrypt";
import { sendOTP } from "../config/mailer.js"; // we'll make this helper
import jwt from "jsonwebtoken";

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
  try {
    const [provider] = await sql`
      SELECT *
      FROM providers
      WHERE id = ${req.params.id}
    `;
    if (!provider) return res.status(404).json({ error: "Provider not found" });
    res.json({ success: true, data: provider });
  } catch (err) {
    console.error("❌ Error fetching provider:", err);
    res.status(500).json({ error: "Failed to fetch provider" });
  }
};

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

// Function for Admin to update ONLY the status of a provider
// This will be used for the final Approve/Reject action.
export const updateProviderStatus = async (req, res) => {
    const { id } = req.params;
    const { status, rejection_reason } = req.body; // status should be 'Approved', 'Rejected', or 'Suspended'

    // Admin-level validation
    if (!['Approved', 'Rejected', 'Suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided for update.' });
    }
    
    // FIX 1: Enforce reason for both Rejected AND Suspended
    if ((status === 'Rejected' || status === 'Suspended') && !rejection_reason) {
        return res.status(400).json({ error: `${status} reason is required for this action.` });
    }
    
    try {
        const updatedProvider = await sql`
            UPDATE providers
            SET
                status = ${status},
                -- FIX 2: Only null out rejection_reason if status is 'Approved'. 
                -- Otherwise, save the reason provided by the user.
                rejection_reason = ${status === 'Approved' ? null : rejection_reason},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING id, name, email, status, rejection_reason
        `;
        
        if (updatedProvider.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
        }
        
        // --- Add Email/Notification Logic Here ---
        // if (status === 'Approved') { sendApprovalEmail(updatedProvider[0]); }
        // else if (status === 'Rejected') { sendRejectionEmail(updatedProvider[0]); }
        // ----------------------------------------

        res.status(200).json({ success: true, data: updatedProvider[0] });
    } catch (error) {
        // Log the detailed error on the server side for debugging
        console.error("❌ Failed to update provider status:", error); 
        res.status(500).json({ error: 'Failed to update provider status' });
    }
}

export const getProvidersByServiceType = async (req, res) => {
  const { service_type } = req.params; // e.g. /service_type/Cleaning

  try {
    const providers = await sql`
      SELECT * FROM providers
      WHERE service_type = ${service_type}
      ORDER BY created_at DESC
    `;

    if (providers.length === 0) {
      return res.status(404).json({ error: "No providers found for this service type" });
    }

    res.status(200).json({ success: true, data: providers });
  } catch (error) {
    console.error("❌ Failed to fetch providers by service type:", error);
    res.status(500).json({ error: "Failed to fetch providers by service type" });
  }
};

