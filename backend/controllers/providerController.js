import { sql } from "../config/db.js";
import bcrypt from "bcrypt";
import { sendOTP } from "../config/mailer.js"; // we'll make this helper
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob";

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
  const {
    name,
    provider_type,
    service_type,
    license_id,
    email,
    phone,
    document,
    status,
    password, // only update if changed
    profile_picture_url,
  } = req.body;

  try {
    // 🔐 Authorization check
    if (!req.user || (req.user.role !== "admin" && req.user.id !== parseInt(id))) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not allowed to edit this provider." });
    }

    // ✅ Dynamic update fields
    const updates = [];
    const params = [];

    if (name) updates.push(`name = $${params.push(name)}`);
    if (provider_type) updates.push(`provider_type = $${params.push(provider_type)}`);
    if (service_type) updates.push(`service_type = $${params.push(service_type)}`);
    if (license_id) updates.push(`license_id = $${params.push(license_id)}`);
    if (email) updates.push(`email = $${params.push(email)}`);
    if (phone) updates.push(`phone = $${params.push(phone)}`);
    if (document) updates.push(`document = $${params.push(document)}`);
    if (status) updates.push(`status = $${params.push(status)}`);
    if (profile_picture_url) updates.push(`profile_picture_url = $${params.push(profile_picture_url)}`);

    // ✅ Hash password only if provided and non-empty
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updates.push(`password = $${params.push(hashedPassword)}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields provided to update" });
    }

    // ✅ Add updated_at
    const query = `
      UPDATE providers
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${params.push(id)}
      RETURNING *;
    `;

    // 🧠 With Neon’s tagged client, use parameterized query
    const result = await sql.unsafe(query, params);

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Provider not found" });
    }

    return res.status(200).json({ success: true, data: result[0] });
  } catch (error) {
    console.error("❌ Failed to update provider:", error);
    res.status(500).json({ error: "Failed to update provider" });
  }
};





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

export const uploadProviderProfilePicture = async (req, res) => {
  const { providerId } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    // ✅ Step 1: Get existing provider details
    const [provider] = await sql`
      SELECT id, name, profile_picture_url
      FROM providers
      WHERE id = ${providerId};
    `;

    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    // ✅ Step 2: Delete existing Blob if exists
    if (provider.profile_picture_url) {
      try {
        const urlParts = provider.profile_picture_url.split("/");
        const existingFileName = urlParts[urlParts.length - 1]; // extract filename from URL
        await del(`Provider-Profile/${existingFileName}`);
        console.log(`🗑️ Deleted old profile picture: ${existingFileName}`);
      } catch (delError) {
        console.warn("⚠️ Failed to delete previous profile picture:", delError.message);
      }
    }

    // ✅ Step 3: Generate clean name (slug) from provider name
    const safeName = provider.name
      ? provider.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()
      : "provider";

    // ✅ Step 4: Upload new file to Vercel Blob with provider info
    const fileName = `Provider-Profile/${providerId}-${safeName}-${Date.now()}-${file.originalname}`;
    const blob = await put(fileName, file.buffer, {
      access: "public",
      contentType: file.mimetype,
    });

    // ✅ Step 5: Update database
    await sql`
      UPDATE providers
      SET profile_picture_url = ${blob.url}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${providerId};
    `;

    console.log(`✅ Uploaded new profile picture for provider #${providerId}`);

    return res.json({
      success: true,
      blobUrl: blob.url,
      message: "Profile picture uploaded successfully.",
    });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};