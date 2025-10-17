import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sql } from '../config/db.js';
import { sendOTP } from '../config/mailer.js'; // we'll make this helper


function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 🔹 Register (with OTP) - pending_registrations only
export const registerUser = async (req, res) => {
  const {
    role = "user",
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

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: "First name, last name, email and password are required" });
  }

  try {
    // check if already exists in live tables
    const [u,p,a,au] = await Promise.all([
      sql`SELECT 1 FROM users WHERE email = ${email}`,
      sql`SELECT 1 FROM providers WHERE email = ${email}`,
      sql`SELECT 1 FROM admins WHERE email = ${email}`,
      sql`SELECT 1 FROM authorized_users WHERE email = ${email}`
    ]);
    if (u.length || p.length || a.length || au.length) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 6);

    const payload = {
      first_name,
      last_name,
      type_of_user,
      email,
      password: hashed,
      unit_no,
      street,
      city,
      province,
      postal_code
    };

    // 🔥 FIX: use JSON.stringify(payload)::jsonb instead of sql.json
    await sql`
      INSERT INTO pending_registrations (role, email, payload, twofa_code, twofa_expires)
      VALUES (
        ${role},
        ${email},
        ${JSON.stringify(payload)}::jsonb,
        ${hashedOtp},
        NOW() + INTERVAL '10 minutes'
      )
      ON CONFLICT (role, email)
      DO UPDATE SET
        payload = EXCLUDED.payload,
        twofa_code = EXCLUDED.twofa_code,
        twofa_expires = EXCLUDED.twofa_expires,
        created_at = CURRENT_TIMESTAMP
    `;

    await sendOTP(email, otp);

    return res.status(201).json({
      success: true,
      message: "OTP sent to email. Please verify to complete registration."
    });
  } catch (err) {
    console.error("❌ Registration (pending) failed:", err);
    return res.status(500).json({ error: "Registration failed" });
  }
};

export const registerProvider = async (req, res) => {
    const { role = "provider",
        name, 
        provider_type, 
        service_type, 
        license_id, 
        email, 
        phone, 
        document, 
        password
     } = req.body;
    if (!name || !provider_type || !service_type || !email || !password) {
        return res.status(400).json({ error: "Name, provider type, service type, email and password are required" });
    }
    try {
        // check if already exists in live tables
        const [u,p,a,au] = await Promise.all([
        sql`SELECT 1 FROM users WHERE email = ${email}`,
        sql`SELECT 1 FROM providers WHERE email = ${email}`,
        sql`SELECT 1 FROM admins WHERE email = ${email}`,
        sql`SELECT 1 FROM authorized_users WHERE email = ${email}`
        ]);
        if (u.length || p.length || a.length || au.length) {
        return res.status(400).json({ error: "Email already exists" });
        }
        const hashed = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 6);
        const payload = {
            role,
            name,
            provider_type,
            service_type,
            license_id,
            email,
            phone,
            document,
            password: hashed
        };
        // 🔥 FIX: use JSON.stringify(payload)::jsonb instead of sql.json
        await sql`
        INSERT INTO pending_registrations (role, email, payload, twofa_code, twofa_expires)
        VALUES (
            'provider',
            ${email},
            ${JSON.stringify(payload)}::jsonb,
            ${hashedOtp},
            NOW() + INTERVAL '10 minutes'
        )
        ON CONFLICT (role, email)
        DO UPDATE SET
            payload = EXCLUDED.payload,
            twofa_code = EXCLUDED.twofa_code,
            twofa_expires = EXCLUDED.twofa_expires,
            created_at = CURRENT_TIMESTAMP
        `;
        await sendOTP(email, otp);
        return res.status(201).json({
        success: true,
        message: "OTP sent to email. Please verify to complete registration."
        });
    } catch (err) {
        console.error("❌ Registration (provider) failed:", err);
        return res.status(500).json({ error: "Registration failed" });
    }
}

export const registerAdmin = async (req, res) => {
    const{
        role = "admin",
        first_name,
        email,
        password,
        role_assigned
    } = req.body;   
    if (!first_name || !email || !password || !role_assigned) {
        return res.status(400).json({ error: "First name, email, password and role are required" });
    }
    try {
        const [u,p,a,au] = await Promise.all([
        sql`SELECT 1 FROM users WHERE email = ${email}`,
        sql`SELECT 1 FROM providers WHERE email = ${email}`,
        sql`SELECT 1 FROM admins WHERE email = ${email}`,
        sql`SELECT 1 FROM authorized_users WHERE email = ${email}`
        ]);
        if (u.length || p.length || a.length || au.length) {
        return res.status(400).json({ error: "Email already exists" });
        }
        const hashed = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 6);
        const payload = {
            role,
            first_name,
            email,
            password: hashed,
            role_assigned
        }
        await sql`
        INSERT INTO pending_registrations (role, email, payload, twofa_code, twofa_expires)
        VALUES (
            'admin',
            ${email},
            ${JSON.stringify(payload)}::jsonb,
            ${hashedOtp},
            NOW() + INTERVAL '10 minutes'
        )
        ON CONFLICT (role, email)
        DO UPDATE SET
            payload = EXCLUDED.payload,
            twofa_code = EXCLUDED.twofa_code,
            twofa_expires = EXCLUDED.twofa_expires,
            created_at = CURRENT_TIMESTAMP
        `;
        await sendOTP(email, otp);
        return res.status(201).json({
        success: true,
        message: "OTP sent to email. Please verify to complete registration."
        });

    } catch (err) {
        console.error("❌ Registration (admin) failed:", err);
        return res.status(500).json({ error: "Registration failed" });
    }
}

export const registerAuthorizedUser = async (req, res) => {
    const body = req.body;
    const{
        role = "authorized",
        client_id,
        first_name,
        last_name,
        email,
        password,
        phone,
        relationship
    } = body;
    if (!client_id || !first_name || !last_name || !email || !password || !relationship) {
        return res.status(400).json({ error: "Client ID, first name, last name, email, password and relationship are required" });
    }
    try {
        const [u,p,a,au] = await Promise.all([
        sql`SELECT 1 FROM users WHERE email = ${email}`,
        sql`SELECT 1 FROM providers WHERE email = ${email}`,
        sql`SELECT 1 FROM admins WHERE email = ${email}`,
        sql`SELECT 1 FROM authorized_users WHERE email = ${email}`
        ]);
        if (u.length || p.length || a.length || au.length) {
        return res.status(400).json({ error: "Email already exists" });
        }
        const hashed = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 6);
        const payload = {
            role,
            client_id,
            first_name,
            last_name,
            email,
            password: hashed,
            phone,
            relationship
        }
        await sql`
        INSERT INTO pending_registrations (role, email, payload, twofa_code, twofa_expires)
        VALUES (
            'authorized',
            ${email},
            ${JSON.stringify(payload)}::jsonb,
            ${hashedOtp},
            NOW() + INTERVAL '10 minutes'
        )
        ON CONFLICT (role, email)
        DO UPDATE SET
            payload = EXCLUDED.payload,
            twofa_code = EXCLUDED.twofa_code,
            twofa_expires = EXCLUDED.twofa_expires,
            created_at = CURRENT_TIMESTAMP
        `;
        await sendOTP(email, otp);
        return res.status(201).json({
        success: true,
        message: "OTP sent to email. Please verify to complete registration."
        });
    } catch (err) {
        console.error("❌ Registration (authorized user) failed:", err);
        return res.status(500).json({ error: "Registration failed" });
    }
}

export const verifyUserOTP = async (req, res) => {
  const { email, otp, role = "user" } = req.body;

  if (!["user","provider","admin","authorized"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const rows = await sql`
      SELECT * FROM pending_registrations
      WHERE role = ${role} AND email = ${email}
    `;
    const pending = rows[0];
    if (!pending) return res.status(404).json({ error: "No pending registration found" });

    const validOTP = await bcrypt.compare(otp, pending.twofa_code);
    if (!validOTP || new Date(pending.twofa_expires) < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // ✅ parse payload safely
    const data = typeof pending.payload === "string"
      ? JSON.parse(pending.payload)
      : pending.payload;

    let result;
    if (role === "user") {
      result = await sql`
        INSERT INTO users (
          first_name, last_name, type_of_user, email, password,
          unit_no, street, city, province, postal_code,
          is_verified, created_at, updated_at
        )
        VALUES (
          ${data.first_name}, ${data.last_name}, ${data.type_of_user}, ${data.email}, ${data.password},
          ${data.unit_no}, ${data.street}, ${data.city}, ${data.province}, ${data.postal_code},
          true, NOW(), NOW()
        ) RETURNING *
      `;
    }
    // ⚡ Add provider/admin/authorized branches here the same way

    await sql`DELETE FROM pending_registrations WHERE id = ${pending.id}`;

    return res.status(200).json({
      success: true,
      message: "Account verified and created successfully",
      data: result[0]
    });
  } catch (err) {
    console.error("❌ OTP verification failed:", err);
    return res.status(500).json({ error: "OTP verification failed" });
  }
};


export const verifyProviderOTP = async (req, res) => {
    const { email, otp, role = "provider" } = req.body;

    if (!["user","provider","admin","authorized"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
    }
    try {
        const rows = await sql`
        SELECT * FROM pending_registrations
        WHERE role = ${role} AND email = ${email}
        `;
        const pending = rows[0];
        if (!pending) return res.status(404).json({ error: "No pending registration found" });
        const validOTP = await bcrypt.compare(otp, pending.twofa_code);
        if (!validOTP || new Date(pending.twofa_expires) < new Date()) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }
        // ✅ parse payload safely
        const data = typeof pending.payload === "string"
        ? JSON.parse(pending.payload)
        : pending.payload;
        let result;
        if (role === "provider") {
            result = await sql`
            INSERT INTO providers (
                name, provider_type, service_type, license_id, email, phone, document,
                password, is_verified, created_at, updated_at
            )
            VALUES (
                ${data.name}, ${data.provider_type}, ${data.service_type}, ${data.license_id}, ${data.email}, ${data.phone}, ${data.document},
                ${data.password}, true, NOW(), NOW()
            ) RETURNING *
            `;
        }
        await sql`DELETE FROM pending_registrations WHERE id = ${pending.id}`;
        return res.status(200).json({
            success: true,
            message: "Account verified and created successfully",
            data: result[0]
        });

    } catch (err) {
        console.error("❌ OTP verification failed:", err);
        return res.status(500).json({ error: "OTP verification failed" });
    }
}

export const verifyAdminOTP = async (req, res) => {
    const { email, otp, role = "admin" } = req.body;

    if (!["user","provider","admin","authorized"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
    }
    try {
        const rows = await sql`
        SELECT * FROM pending_registrations
        WHERE role = ${role} AND email = ${email}
        `;
        const pending = rows[0];
        if (!pending) return res.status(404).json({ error: "No pending registration found" });
        const validOTP = await bcrypt.compare(otp, pending.twofa_code);
        if (!validOTP || new Date(pending.twofa_expires) < new Date()) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }   
        // ✅ parse payload safely
        const data = typeof pending.payload === "string"
        ? JSON.parse(pending.payload)
        : pending.payload;
        let result;
        if (role === "admin") {
            result = await sql`
            INSERT INTO admins (
                first_name, email, password, role,
                is_verified, created_at, updated_at
            ) VALUES (
                ${data.first_name}, ${data.email}, ${data.password}, ${data.role_assigned},
                true, NOW(), NOW()
            ) RETURNING *
            `;
        }
        await sql`DELETE FROM pending_registrations WHERE id = ${pending.id}`;
        return res.status(200).json({
            success: true,
            message: "Account verified and created successfully",
            data: result[0]
        });
    } catch (err) {
        console.error("❌ OTP verification failed:", err);
        return res.status(500).json({ error: "OTP verification failed" });
    }

}
export const verifyAuthorizedOTP = async (req, res) => {
    const { email, otp, role = "authorized" } = req.body;

    if (!["user","provider","admin","authorized"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
    }

    try {
        const rows = await sql`
            SELECT * FROM pending_registrations
            WHERE role = ${role} AND email = ${email}
        `;
        const pending = rows[0];
        if (!pending) return res.status(404).json({ error: "No pending registration found" });

        const validOTP = await bcrypt.compare(otp, pending.twofa_code);
        if (!validOTP || new Date(pending.twofa_expires) < new Date()) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // ✅ parse payload safely
        const data = typeof pending.payload === "string"
            ? JSON.parse(pending.payload)
            : pending.payload;

        let result;
        if (role === "authorized") {
            result = await sql`
                INSERT INTO authorized_users (
                    client_id, first_name, last_name, email, phone, relationship, password, is_active, created_at
                ) VALUES (
                    ${data.client_id}, ${data.first_name}, ${data.last_name}, ${data.email}, 
                    ${data.phone}, ${data.relationship}, ${data.password}, true, NOW()
                ) RETURNING *
            `;
        }

        await sql`DELETE FROM pending_registrations WHERE id = ${pending.id}`;

        return res.status(200).json({
            success: true,
            message: "Account verified and created successfully",
            data: result[0]
        });
    } catch (err) {
        console.error("❌ OTP verification failed:", err);
        return res.status(500).json({ error: "OTP verification failed" });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    try {
        const users = await sql`SELECT * FROM users WHERE email = ${email}`;
        const user = users[0];
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: { token, user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name } }
        });
    } catch (err) {
        console.error("❌ Login failed:", err);
        res.status(500).json({ error: "Login failed" });
    }
}

export const loginProvider = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    try {
        const providers = await sql`SELECT * FROM providers WHERE email = ${email}`;
        const provider = providers[0];
        if (!provider) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const validPassword = await bcrypt.compare(password, provider.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = jwt.sign(
            { id: provider.id, email: provider.email, role: 'provider' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: { token, provider: { id: provider.id, email: provider.email, name: provider.name } }
        });
    } catch (err) {
        console.error("❌ Login failed:", err);
        res.status(500).json({ error: "Login failed" });
    }
}

export const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    try {
        // Target the 'admins' table
        const admins = await sql`SELECT * FROM admins WHERE email = ${email}`;
        const admin = admins[0];

        // Check 1: User existence
        if (!admin) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Check 2: Password validation
        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Check 3 (Optional but highly recommended): Role verification
        // Ensure the role property is correct for the middleware
        const role = admin.role || 'admin'; 

        // Generate JWT with the 'admin' role
        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            success: true,
            message: "Admin login successful",
            data: { 
                token, 
                admin: { 
                    id: admin.id, 
                    email: admin.email, 
                    first_name: admin.first_name,
                    role: admin.role // Use the specific role_assigned
                } 
            }
        });
    } catch (err) {
        console.error("❌ Admin login failed:", err);
        res.status(500).json({ error: "Admin login failed" });
    }
};