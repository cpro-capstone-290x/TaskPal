import { sql } from "../config/db.js";
import bcrypt from "bcrypt";
import { sendOTP } from "../config/mailer.js"; // we'll make this helper
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob";

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In providerController.js (at the top, near imports)

// Helper function to create safe filenames
const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
};

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
    profile_picture_url,
    note,
    password, // Get the password, if it was sent
  } = req.body;

  try {
    // 1. Get the current provider data (for password fallback)
    const [existingProvider] = await sql`
      SELECT password FROM providers WHERE id = ${id}
    `;

    if (!existingProvider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    // 2. Handle password update
    let passwordHash = existingProvider.password; // Default to the old, existing hash
    
    // Only if a new, non-empty password was provided, hash it.
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
      console.log(`Password updated for provider ${id}`);
    }

    // 3. Run the simple, explicit update query
    const result = await sql`
      UPDATE providers
      SET
        name = ${name},
        provider_type = ${provider_type},
        service_type = ${service_type},
        license_id = ${license_id},
        email = ${email},
        phone = ${phone},
        document = ${document},
        status = ${status},
        profile_picture_url = ${profile_picture_url},
        note = ${note},
        password = ${passwordHash}, 
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    if (!result || result.length === 0) {
      // This shouldn't happen if the first check passed, but it's good practice
      return res.status(404).json({ error: "Provider not found during update" });
    }

    // Return 200 OK with the newly updated data
    return res.status(200).json({ success: true, data: result[0] });

  } catch (error) {
    console.error("❌ Failed to update provider:", error);
    if (error.code === '23505') { // Handle unique email constraint
      return res.status(409).json({ error: `Failed to update: ${error.detail}` });
    }
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
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    // ✅ Step 1: Get existing provider details
    const [provider] = await sql`
      SELECT id, name, profile_picture_url
      FROM providers
      WHERE id = ${id};
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
    const fileName = `Provider-Profile/${id}-${safeName}-${Date.now()}-${file.originalname}`;
    const blob = await put(fileName, file.buffer, {
      access: "public",
      contentType: file.mimetype,
    });

    // ✅ Step 5: Update database
    await sql`
      UPDATE providers
      SET profile_picture_url = ${blob.url}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id};
    `;

    console.log(`✅ Uploaded new profile picture for provider #${id}`);

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

// 👇 ADD THIS NEW FUNCTION
export const uploadValidId = async (req, res) => {
  try {
    // 1. Check for .env variable
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("❌ BLOB_READ_WRITE_TOKEN is not set in .env file!");
      return res.status(500).json({ error: "Server upload configuration error" });
    }
    
    // 2. Check for file
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 3. Get the name and ID details from req.body (sent from the form)
    const { name, id_type, id_number } = req.body;

    // 4. Create "safe" versions of the text using your slugify helper
    const safeName = slugify(name || "provider");
    const safeIdType = slugify(id_type || "id");
    const safeIdNumber = slugify(id_number || Date.now()); // Use timestamp as fallback

    // 5. Get the original file extension (e.g., "pdf" or "jpg")
    const originalName = req.file.originalname || "file.dat";
    const extension = originalName.split(".").pop() || "dat";

    // 6. Create the new filename
    const fileName = `Provider-ValidID/${safeName}_${safeIdType}_${safeIdNumber}.${extension}`;

    // 7. Upload to Vercel Blob
    const blob = await put(
      fileName, // Use the new descriptive filename
      req.file.buffer,
      {
        access: "public",
        contentType: req.file.mimetype,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );

    // 8. Return the new URL
    return res.json({ success: true, url: blob.url });
  } catch (err) {
    console.error("❌ Upload failed:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
};