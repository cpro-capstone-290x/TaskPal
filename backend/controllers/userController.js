// backend/controllers/userController.js

import { sql } from "../config/db.js";
import { sendOTP } from "../config/mailer.js"; // we'll make this helper
import jwt from "jsonwebtoken";
import { put, del } from "@vercel/blob";


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

export const updateUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      unit_no,
      street,
      city,
      province,
      postal_code,
      password,
    } = req.body;

    console.log("Updating user:", id, req.body);

    const updated = await sql`
      UPDATE users
      SET
        first_name = ${first_name},
        last_name = ${last_name},
        email = ${email},
        unit_no = ${unit_no},
        street = ${street},
        city = ${city},
        province = ${province},
        postal_code = ${postal_code}
      WHERE id = ${id}
      RETURNING *;
    `;

    if (updated.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error("Error updating user:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to update user" });
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
// ✅ POST /users/:id/profile-picture
export const uploadProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    // 🔍 1️⃣ Fetch user details (for first name + old profile URL)
    const [existingUser] = await sql`
      SELECT first_name, profile_picture FROM users WHERE id = ${id}
    `;
    if (!existingUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const oldPictureUrl = existingUser.profile_picture;
    const firstName = existingUser.first_name
      ? existingUser.first_name.replace(/\s+/g, "_") // remove spaces
      : "User";

    // 🔥 2️⃣ Delete the previous Blob file (if not the default avatar)
    if (
      oldPictureUrl &&
      !oldPictureUrl.includes("flaticon.com") && // default avatar check
      oldPictureUrl.includes("vercel-storage.com")
    ) {
      try {
        const oldPath = decodeURIComponent(oldPictureUrl.split(".com/")[1]);
        await del(oldPath, { token: process.env.BLOB_READ_WRITE_TOKEN });
        console.log("🧹 Deleted old profile picture from Blob:", oldPath);
      } catch (deleteErr) {
        console.warn("⚠️ Failed to delete old profile picture:", deleteErr.message);
      }
    }

    // 📤 3️⃣ Upload new Blob with filename: Profile-Picture/{firstname}_{id}_{timestamp}.jpg
    const timestamp = Date.now();
    const blobPath = `Profile-Picture/${firstName}_${id}_${timestamp}.jpg`;

    const upload = await put(blobPath, file.buffer, {
      access: "public",
      contentType: file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });

    console.log("✅ Uploaded new profile picture:", upload.url);

    // 💾 4️⃣ Save the new URL in Neon
    const [updatedUser] = await sql`
      UPDATE users
      SET profile_picture = ${upload.url}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      blobUrl: upload.url,
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Error uploading profile picture:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload profile picture",
    });
  }
};

export const getPublicUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`
      SELECT 
        id, 
        CONCAT(first_name, ' ', last_name) AS name,
        email, 
        city, 
        province, 
        profile_picture,
        created_at
      FROM users 
      WHERE id = ${id};
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];
    user.profile_picture =
      user.profile_picture ||
      "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    res.status(200).json({ data: user });
  } catch (err) {
    console.error("❌ Error fetching public user:", err);
    res.status(500).json({ message: "Server error fetching user profile" });
  }
};
