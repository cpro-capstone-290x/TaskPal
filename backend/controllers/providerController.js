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
    const { status, rejection_reason } = req.body; // status should be 'Approved' or 'Rejected'

    // Admin-level validation
    if (!['Approved', 'Rejected', 'Suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided for update.' });
    }
    if (status === 'Rejected' && !rejection_reason) {
        // This is important for provider feedback
        return res.status(400).json({ error: 'Rejection reason is required for Rejected status.' });
    }
    
    try {
        const updatedProvider = await sql`
            UPDATE providers
            SET
                status = ${status},
                -- Only update rejection_reason if status is Rejected, otherwise null it out.
                rejection_reason = ${status === 'Rejected' ? rejection_reason : null},
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

