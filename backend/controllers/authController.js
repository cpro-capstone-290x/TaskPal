import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sql } from "../config/db.js";
import { sendOTP } from "../config/mailer.js";
import { logAudit } from "../utils/auditLogger.js";
import logger from "../utils/logger.js";

/* -------------------------------------------------------------------------- */
/* HELPERS: traceId + masking                                                 */
/* -------------------------------------------------------------------------- */

const getTraceId = (req) =>
  req.traceId ||
  req.headers["x-request-id"] ||
  crypto.randomUUID();

const maskEmail = (email = "") => {
  if (!email || typeof email !== "string") return "";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) {
    return `${local[0] || "*"}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

const maskPhone = (phone = "") => {
  if (!phone || typeof phone !== "string") return "";
  if (phone.length <= 4) return "*".repeat(phone.length);
  const start = phone.slice(0, 2);
  const end = phone.slice(-2);
  return `${start}***${end}`;
};

/* -------------------------------------------------------------------------- */

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 🔹 Register (with OTP) - pending_registrations only
export const registerUser = async (req, res) => {
  const traceId = getTraceId(req);

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
    postal_code,
    date_of_birth,
    gender,
    assistance_level,
    living_situation,
    emergency_contact_name,
    emergency_contact_relationship,
    emergency_contact_phone,
    id_document_url,
    pwd_document_url,
    terms_accepted,
  } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res
      .status(400)
      .json({ error: "First name, last name, email and password are required" });
  }

  if (!terms_accepted) {
    return res
      .status(400)
      .json({ error: "You must agree to the Terms & Conditions." });
  }

  try {
    logger.info("User registration initiated", {
      traceId,
      role,
      email: maskEmail(email),
    });

    const [u, p, a, au] = await Promise.all([
      sql`SELECT 1 FROM users WHERE email = ${email}`,
      sql`SELECT 1 FROM providers WHERE email = ${email}`,
      sql`SELECT 1 FROM admins WHERE email = ${email}`,
      sql`SELECT 1 FROM authorized_users WHERE email = ${email}`,
    ]);

    if (u.length || p.length || a.length || au.length) {
      logger.warn("Registration rejected: email already exists", {
        traceId,
        role,
        email: maskEmail(email),
      });
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 6);

    const payload = {
      role,
      first_name,
      last_name,
      type_of_user,
      email,
      password: hashed,
      unit_no,
      street,
      city,
      province,
      postal_code,
      date_of_birth,
      gender,
      assistance_level,
      living_situation,
      emergency_contact_name,
      emergency_contact_relationship,
      emergency_contact_phone,
      id_document_url,
      pwd_document_url,
      terms_accepted,
      terms_accepted_at: new Date().toISOString(),
    };

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

    // System + audit logs
    logger.info("User registration pending OTP", {
      traceId,
      role,
      email: maskEmail(email),
    });
    logAudit(null, "REGISTRATION_PENDING", {
      role,
      email: maskEmail(email),
    });

    sendOTP(email, otp);

    return res.status(201).json({
      success: true,
      message: "OTP sent to email. Please verify to complete registration.",
    });
  } catch (err) {
    logger.error("Registration (pending) failed", {
      traceId,
      role,
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Registration failed" });
  }
};

export const registerProvider = async (req, res) => {
  const traceId = getTraceId(req);

  const {
    role = "provider",
    name,
    provider_type,
    service_type,
    license_id,
    email,
    phone,
    postal_code,
    valid_id_url,
    company_documents,
    background_check_url,
    id_type,
    id_number,
    id_expiry,
    insurance_provider,
    insurance_policy_number,
    insurance_expiry,
    insurance_document_url,
    password,
    terms_accepted,
    note,
  } = req.body;

  if (!name || !provider_type || !service_type || !email || !password) {
    return res.status(400).json({
      error: "Name, provider type, service type, email and password are required",
    });
  }

  if (!terms_accepted) {
    return res.status(400).json({
      error: "You must agree to the Terms & Conditions before registering.",
    });
  }

  if (!valid_id_url || !id_type || !id_number || !id_expiry) {
    return res.status(400).json({
      error: "Valid ID, type, number and expiry are required.",
    });
  }

  try {
    logger.info("Provider registration initiated", {
      traceId,
      role,
      email: maskEmail(email),
    });

    const [u, p, a, au] = await Promise.all([
      sql`SELECT 1 FROM users WHERE email = ${email}`,
      sql`SELECT 1 FROM providers WHERE email = ${email}`,
      sql`SELECT 1 FROM admins WHERE email = ${email}`,
      sql`SELECT 1 FROM authorized_users WHERE email = ${email}`,
    ]);

    if (u.length || p.length || a.length || au.length) {
      logger.warn("Provider registration rejected: email already exists", {
        traceId,
        role,
        email: maskEmail(email),
      });
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
      postal_code,
      valid_id_url,
      company_documents,
      background_check_url,
      id_type,
      id_number,
      id_expiry,
      insurance_provider,
      insurance_policy_number,
      insurance_expiry,
      insurance_document_url,
      password: hashed,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      note,
    };

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

    logger.info("Provider registration pending OTP", {
      traceId,
      role: "provider",
      email: maskEmail(email),
    });
    logAudit(null, "PROVIDER_REGISTRATION_PENDING", {
      role: "provider",
      email: maskEmail(email),
    });

    await sendOTP(email, otp);

    return res.status(201).json({
      success: true,
      message: "OTP sent to email. Please verify to complete registration.",
    });
  } catch (err) {
    logger.error("Registration (provider) failed", {
      traceId,
      role: "provider",
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Registration failed" });
  }
};

export const registerAdmin = async (req, res) => {
  const traceId = getTraceId(req);

  const { role = "admin", first_name, email, password, role_assigned } = req.body;
  if (!first_name || !email || !password || !role_assigned) {
    return res.status(400).json({
      error: "First name, email, password and role are required",
    });
  }

  try {
    logger.info("Admin registration initiated", {
      traceId,
      role,
      email: maskEmail(email),
    });

    const [u, p, a, au] = await Promise.all([
      sql`SELECT 1 FROM users WHERE email = ${email}`,
      sql`SELECT 1 FROM providers WHERE email = ${email}`,
      sql`SELECT 1 FROM admins WHERE email = ${email}`,
      sql`SELECT 1 FROM authorized_users WHERE email = ${email}`,
    ]);
    if (u.length || p.length || a.length || au.length) {
      logger.warn("Admin registration rejected: email already exists", {
        traceId,
        role,
        email: maskEmail(email),
      });
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
      role_assigned,
    };

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

    logger.info("Admin registration pending OTP", {
      traceId,
      role: "admin",
      email: maskEmail(email),
    });
    logAudit(null, "ADMIN_REGISTRATION_PENDING", {
      role: "admin",
      email: maskEmail(email),
    });

    return res.status(201).json({
      success: true,
      message: "OTP sent to email. Please verify to complete registration.",
    });
  } catch (err) {
    logger.error("Registration (admin) failed", {
      traceId,
      role: "admin",
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Registration failed" });
  }
};

export const registerAuthorizedUser = async (req, res) => {
  const traceId = getTraceId(req);

  const body = req.body;
  const {
    role = "authorized",
    client_id,
    first_name,
    last_name,
    email,
    password,
    phone,
    relationship,
  } = body;
  if (
    !client_id ||
    !first_name ||
    !last_name ||
    !email ||
    !password ||
    !relationship
  ) {
    return res.status(400).json({
      error:
        "Client ID, first name, last name, email, password and relationship are required",
    });
  }
  try {
    logger.info("Authorized user registration initiated", {
      traceId,
      role,
      email: maskEmail(email),
    });

    const [u, p, a, au] = await Promise.all([
      sql`SELECT 1 FROM users WHERE email = ${email}`,
      sql`SELECT 1 FROM providers WHERE email = ${email}`,
      sql`SELECT 1 FROM admins WHERE email = ${email}`,
      sql`SELECT 1 FROM authorized_users WHERE email = ${email}`,
    ]);
    if (u.length || p.length || a.length || au.length) {
      logger.warn("Authorized registration rejected: email already exists", {
        traceId,
        role,
        email: maskEmail(email),
      });
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
      relationship,
    };
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

    logger.info("Authorized user registration pending OTP", {
      traceId,
      role: "authorized",
      email: maskEmail(email),
    });
    logAudit(null, "AUTHORIZED_REGISTRATION_PENDING", {
      role: "authorized",
      email: maskEmail(email),
    });

    return res.status(201).json({
      success: true,
      message: "OTP sent to email. Please verify to complete registration.",
    });
  } catch (err) {
    logger.error("Registration (authorized user) failed", {
      traceId,
      role: "authorized",
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Registration failed" });
  }
};

/* -------------------------------------------------------------------------- */
/* OTP VERIFICATION (User / Provider / Admin / Authorized)                    */
/* -------------------------------------------------------------------------- */

export const verifyUserOTP = async (req, res) => {
  const traceId = getTraceId(req);
  const { email, otp, role = "user" } = req.body;

  if (!["user", "provider", "admin", "authorized"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    logger.info("OTP verification attempt", {
      traceId,
      role,
      email: maskEmail(email),
    });

    const rows = await sql`
      SELECT * FROM pending_registrations
      WHERE role = ${role} AND email = ${email}
    `;
    const pending = rows[0];
    if (!pending) {
      logger.warn("OTP verification failed: no pending registration", {
        traceId,
        role,
        email: maskEmail(email),
      });
      return res.status(404).json({ error: "No pending registration found" });
    }

    const validOTP = await bcrypt.compare(otp, pending.twofa_code);
    if (!validOTP || new Date(pending.twofa_expires) < new Date()) {
      logger.warn("OTP verification failed: invalid or expired OTP", {
        traceId,
        role,
        email: maskEmail(email),
      });
      logAudit(null, "REGISTRATION_OTP_FAILED", {
        role,
        email: maskEmail(email),
      });
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const data =
      typeof pending.payload === "string"
        ? JSON.parse(pending.payload)
        : pending.payload;

    let result;
    if (role === "user") {
      result = await sql`
        INSERT INTO users (
          first_name,
          last_name,
          type_of_user,
          email,
          password,
          unit_no,
          street,
          city,
          province,
          postal_code,
          date_of_birth,
          gender,
          assistance_level,
          living_situation,
          emergency_contact_name,
          emergency_contact_relationship,
          emergency_contact_phone,
          id_document_url,
          pwd_document_url,
          terms_accepted,
          terms_accepted_at,
          is_verified,
          created_at,
          updated_at
        )
        VALUES (
          ${data.first_name},
          ${data.last_name},
          ${data.type_of_user},
          ${data.email},
          ${data.password},
          ${data.unit_no},
          ${data.street},
          ${data.city},
          ${data.province},
          ${data.postal_code},
          ${data.date_of_birth},
          ${data.gender},
          ${data.assistance_level},
          ${data.living_situation},
          ${data.emergency_contact_name},
          ${data.emergency_contact_relationship},
          ${data.emergency_contact_phone},
          ${data.id_document_url},
          ${data.pwd_document_url},
          ${data.terms_accepted},
          ${data.terms_accepted_at},
          true,
          NOW(),
          NOW()
        )
        RETURNING *
      `;
    }

    await sql`DELETE FROM pending_registrations WHERE id = ${pending.id}`;

    const createdUser = result[0];

    logger.info("User registration completed", {
      traceId,
      role: "user",
      userId: createdUser.id,
      email: maskEmail(createdUser.email),
    });
    logAudit(createdUser.id, "USER_REGISTERED", {
      role: "user",
      email: maskEmail(createdUser.email),
    });

    return res.status(200).json({
      success: true,
      message: "Account verified and created successfully",
      data: createdUser,
    });
  } catch (err) {
    logger.error("OTP verification (user) failed", {
      traceId,
      role,
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

export const verifyProviderOTP = async (req, res) => {
  const traceId = getTraceId(req);
  const { email, otp, role = "provider" } = req.body;

  if (!["user", "provider", "admin", "authorized"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    logger.info("Provider OTP verification attempt", {
      traceId,
      role,
      email: maskEmail(email),
    });

    const rows = await sql`
      SELECT * FROM pending_registrations
      WHERE role = ${role} AND email = ${email}
    `;
    const pending = rows[0];

    if (!pending) {
      logger.warn("Provider OTP verification failed: no pending registration", {
        traceId,
        role,
        email: maskEmail(email),
      });
      return res.status(404).json({ error: "No pending registration found" });
    }

    const validOTP = await bcrypt.compare(otp, pending.twofa_code);
    if (!validOTP || new Date(pending.twofa_expires) < new Date()) {
      logger.warn("Provider OTP verification failed: invalid or expired OTP", {
        traceId,
        role,
        email: maskEmail(email),
      });
      logAudit(null, "PROVIDER_REGISTRATION_OTP_FAILED", {
        role,
        email: maskEmail(email),
      });
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const data =
      typeof pending.payload === "string"
        ? JSON.parse(pending.payload)
        : pending.payload;

    const termsAccepted =
      data.terms_accepted === true || data.terms_accepted === "true";
    const termsAcceptedAt = data.terms_accepted_at
      ? new Date(data.terms_accepted_at)
      : new Date();

    let result;

    if (role === "provider") {
      result = await sql`
        INSERT INTO providers (
          name,
          provider_type,
          service_type,
          license_id,
          email,
          phone,
          postal_code,
          company_documents,
          valid_id_url,
          background_check_url,
          id_type,
          id_number,
          id_expiry,
          insurance_provider,
          insurance_policy_number,
          insurance_expiry,
          insurance_document_url,
          password,
          terms_accepted,
          terms_accepted_at,
          note,
          is_verified,
          created_at,
          updated_at
        )
        VALUES (
          ${data.name},
          ${data.provider_type},
          ${data.service_type},
          ${data.license_id},
          ${data.email},
          ${data.phone},
          ${data.postal_code},
          ${JSON.stringify(data.company_documents || [])}::jsonb,
          ${data.valid_id_url},
          ${data.background_check_url},
          ${data.id_type},
          ${data.id_number},
          ${data.id_expiry},
          ${data.insurance_provider},
          ${data.insurance_policy_number},
          ${data.insurance_expiry},
          ${data.insurance_document_url},
          ${data.password},
          ${termsAccepted},
          ${termsAcceptedAt},
          ${data.note},
          true,
          NOW(),
          NOW()
        )
        RETURNING *
      `;
    }

    await sql`DELETE FROM pending_registrations WHERE id = ${pending.id}`;

    const createdProvider = result[0];

    logger.info("Provider registration completed", {
      traceId,
      role: "provider",
      providerId: createdProvider.id,
      email: maskEmail(createdProvider.email),
      phone: maskPhone(createdProvider.phone),
    });
    logAudit(createdProvider.id, "PROVIDER_REGISTERED", {
      role: "provider",
      email: maskEmail(createdProvider.email),
    });

    return res.status(200).json({
      success: true,
      message: "Account verified and created successfully",
      data: createdProvider,
    });
  } catch (err) {
    logger.error("OTP verification (provider) failed", {
      traceId,
      role,
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

export const verifyAdminOTP = async (req, res) => {
  const traceId = getTraceId(req);
  const { email, otp, role = "admin" } = req.body;

  if (!["user", "provider", "admin", "authorized"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  try {
    logger.info("Admin OTP verification attempt", {
      traceId,
      role,
      email: maskEmail(email),
    });

    const rows = await sql`
      SELECT * FROM pending_registrations
      WHERE role = ${role} AND email = ${email}
    `;
    const pending = rows[0];
    if (!pending) {
      logger.warn("Admin OTP verification failed: no pending registration", {
        traceId,
        role,
        email: maskEmail(email),
      });
      return res.status(404).json({ error: "No pending registration found" });
    }

    const validOTP = await bcrypt.compare(otp, pending.twofa_code);
    if (!validOTP || new Date(pending.twofa_expires) < new Date()) {
      logger.warn("Admin OTP verification failed: invalid or expired OTP", {
        traceId,
        role,
        email: maskEmail(email),
      });
      logAudit(null, "ADMIN_REGISTRATION_OTP_FAILED", {
        role,
        email: maskEmail(email),
      });
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const data =
      typeof pending.payload === "string"
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

    const createdAdmin = result[0];

    logger.info("Admin registration completed", {
      traceId,
      role: "admin",
      adminId: createdAdmin.id,
      email: maskEmail(createdAdmin.email),
    });
    logAudit(createdAdmin.id, "ADMIN_REGISTERED", {
      role: "admin",
      email: maskEmail(createdAdmin.email),
    });

    return res.status(200).json({
      success: true,
      message: "Account verified and created successfully",
      data: createdAdmin,
    });
  } catch (err) {
    logger.error("OTP verification (admin) failed", {
      traceId,
      role,
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

export const verifyAuthorizedOTP = async (req, res) => {
  const traceId = getTraceId(req);
  const { email, otp, role = "authorized" } = req.body;

  if (!["user", "provider", "admin", "authorized"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    logger.info("Authorized user OTP verification attempt", {
      traceId,
      role,
      email: maskEmail(email),
    });

    const rows = await sql`
      SELECT * FROM pending_registrations
      WHERE role = ${role} AND email = ${email}
    `;
    const pending = rows[0];
    if (!pending) {
      logger.warn(
        "Authorized user OTP verification failed: no pending registration",
        {
          traceId,
          role,
          email: maskEmail(email),
        }
      );
      return res.status(404).json({ error: "No pending registration found" });
    }

    const validOTP = await bcrypt.compare(otp, pending.twofa_code);
    if (!validOTP || new Date(pending.twofa_expires) < new Date()) {
      logger.warn(
        "Authorized user OTP verification failed: invalid or expired OTP",
        {
          traceId,
          role,
          email: maskEmail(email),
        }
      );
      logAudit(null, "AUTHORIZED_REGISTRATION_OTP_FAILED", {
        role,
        email: maskEmail(email),
      });
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const data =
      typeof pending.payload === "string"
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

    const createdAuthUser = result[0];

    logger.info("Authorized user registration completed", {
      traceId,
      role: "authorized",
      authorizedUserId: createdAuthUser.id,
      email: maskEmail(createdAuthUser.email),
      phone: maskPhone(createdAuthUser.phone),
    });
    logAudit(createdAuthUser.id, "AUTHORIZED_USER_REGISTERED", {
      role: "authorized",
      email: maskEmail(createdAuthUser.email),
    });

    return res.status(200).json({
      success: true,
      message: "Account verified and created successfully",
      data: createdAuthUser,
    });
  } catch (err) {
    logger.error("OTP verification (authorized) failed", {
      traceId,
      role,
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

/* -------------------------------------------------------------------------- */
/* LOGIN                                                                      */
/* -------------------------------------------------------------------------- */

export const loginUser = async (req, res) => {
  const traceId = getTraceId(req);
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and password are required" });
  }
  try {
    logger.info("Login attempt", {
      traceId,
      role: "user",
      email: maskEmail(email),
    });

    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    const user = users[0];
    if (!user) {
      logger.warn("Login failed: user not found", {
        traceId,
        role: "user",
        email: maskEmail(email),
      });
      logAudit(null, "LOGIN_FAILED", {
        role: "user",
        email: maskEmail(email),
        reason: "not_found",
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger.warn("Login failed: invalid password", {
        traceId,
        role: "user",
        email: maskEmail(email),
        userId: user.id,
      });
      logAudit(user.id, "LOGIN_FAILED", {
        role: "user",
        email: maskEmail(email),
        reason: "invalid_password",
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    logger.info("Login successful", {
      traceId,
      role: "user",
      userId: user.id,
      email: maskEmail(user.email),
    });
    logAudit(user.id, "LOGIN_SUCCESS", {
      role: "user",
      email: maskEmail(user.email),
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      },
    });
  } catch (err) {
    logger.error("Login (user) failed", {
      traceId,
      role: "user",
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Login failed" });
  }
};

export const loginProvider = async (req, res) => {
  const traceId = getTraceId(req);
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and password are required" });
  }
  try {
    logger.info("Login attempt", {
      traceId,
      role: "provider",
      email: maskEmail(email),
    });

    const providers = await sql`SELECT * FROM providers WHERE email = ${email}`;
    const provider = providers[0];
    if (!provider) {
      logger.warn("Login failed: provider not found", {
        traceId,
        role: "provider",
        email: maskEmail(email),
      });
      logAudit(null, "LOGIN_FAILED", {
        role: "provider",
        email: maskEmail(email),
        reason: "not_found",
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const validPassword = await bcrypt.compare(password, provider.password);
    if (!validPassword) {
      logger.warn("Login failed: invalid password", {
        traceId,
        role: "provider",
        providerId: provider.id,
        email: maskEmail(email),
      });
      logAudit(provider.id, "LOGIN_FAILED", {
        role: "provider",
        email: maskEmail(email),
        reason: "invalid_password",
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: provider.id, email: provider.email, role: "provider" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    logger.info("Login successful", {
      traceId,
      role: "provider",
      providerId: provider.id,
      email: maskEmail(provider.email),
    });
    logAudit(provider.id, "LOGIN_SUCCESS", {
      role: "provider",
      email: maskEmail(provider.email),
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        provider: {
          id: provider.id,
          email: provider.email,
          name: provider.name,
        },
      },
    });
  } catch (err) {
    logger.error("Login (provider) failed", {
      traceId,
      role: "provider",
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Login failed" });
  }
};

export const loginAdmin = async (req, res) => {
  const traceId = getTraceId(req);
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and password are required" });
  }
  try {
    logger.info("Login attempt", {
      traceId,
      role: "admin",
      email: maskEmail(email),
    });

    const admins = await sql`SELECT * FROM admins WHERE email = ${email}`;
    const admin = admins[0];

    if (!admin) {
      logger.warn("Login failed: admin not found", {
        traceId,
        role: "admin",
        email: maskEmail(email),
      });
      logAudit(null, "LOGIN_FAILED", {
        role: "admin",
        email: maskEmail(email),
        reason: "not_found",
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      logger.warn("Login failed: invalid password", {
        traceId,
        role: "admin",
        adminId: admin.id,
        email: maskEmail(email),
      });
      logAudit(admin.id, "LOGIN_FAILED", {
        role: "admin",
        email: maskEmail(email),
        reason: "invalid_password",
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const role = admin.role || "admin";

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    logger.info("Admin login successful", {
      traceId,
      role,
      adminId: admin.id,
      email: maskEmail(admin.email),
    });
    logAudit(admin.id, "LOGIN_SUCCESS", {
      role,
      email: maskEmail(admin.email),
    });

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          first_name: admin.first_name,
          role: admin.role,
        },
      },
    });
  } catch (err) {
    logger.error("Admin login failed", {
      traceId,
      role: "admin",
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Admin login failed" });
  }
};

/* -------------------------------------------------------------------------- */
/* PASSWORD RESET FLOW                                                        */
/* -------------------------------------------------------------------------- */

export const sendPasswordResetOTP = async (req, res) => {
  const traceId = getTraceId(req);
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    logger.info("Password reset OTP requested", {
      traceId,
      email: maskEmail(email),
    });

    const [u, p, a] = await Promise.all([
      sql`SELECT id, email FROM users WHERE email = ${email}`,
      sql`SELECT id, email FROM providers WHERE email = ${email}`,
      sql`SELECT id, email FROM admins WHERE email = ${email}`,
    ]);

    const account = u[0] || p[0] || a[0];
    const accountRole = u[0] ? "user" : p[0] ? "provider" : a[0] ? "admin" : null;

    if (!account) {
      logger.warn("Password reset request for non-existing email", {
        traceId,
        email: maskEmail(email),
      });
      return res.status(404).json({ error: "Email not found" });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await sql`
      INSERT INTO pending_registrations (role, email, payload, twofa_code, twofa_expires)
      VALUES (
        'password_reset',
        ${email},
        '{}'::jsonb,
        ${hashedOtp},
        NOW() + INTERVAL '10 minutes'
      )
      ON CONFLICT (role, email)
      DO UPDATE SET
        twofa_code = EXCLUDED.twofa_code,
        twofa_expires = EXCLUDED.twofa_expires,
        created_at = CURRENT_TIMESTAMP
    `;

    await sendOTP(email, otp);

    logger.info("Password reset OTP sent", {
      traceId,
      accountRole,
      userId: account.id,
      email: maskEmail(email),
    });
    logAudit(account.id, "PASSWORD_RESET_REQUESTED", {
      role: accountRole,
      email: maskEmail(email),
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email.",
    });
  } catch (err) {
    logger.error("Send password reset OTP failed", {
      traceId,
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Failed to send reset OTP" });
  }
};

export const verifyPasswordResetOTP = async (req, res) => {
  const traceId = getTraceId(req);
  const { email, otp } = req.body;
  if (!email || !otp)
    return res
      .status(400)
      .json({ error: "Email and OTP are required" });

  try {
    logger.info("Password reset OTP verification attempt", {
      traceId,
      email: maskEmail(email),
    });

    const rows = await sql`
      SELECT * FROM pending_registrations
      WHERE role = 'password_reset' AND email = ${email}
    `;
    const pending = rows[0];
    if (!pending)
      return res
        .status(404)
        .json({ error: "No password reset request found" });

    const valid = await bcrypt.compare(otp, pending.twofa_code);
    const expired = new Date(pending.twofa_expires) < new Date();
    if (!valid || expired) {
      logger.warn("Password reset OTP invalid or expired", {
        traceId,
        email: maskEmail(email),
      });
      return res
        .status(400)
        .json({ error: "Invalid or expired OTP" });
    }

    await sql`
      UPDATE pending_registrations
      SET twofa_expires = NOW() + INTERVAL '5 minutes'
      WHERE id = ${pending.id}
    `;

    logger.info("Password reset OTP verified", {
      traceId,
      email: maskEmail(email),
    });

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. You may now reset your password.",
    });
  } catch (err) {
    logger.error("Verify password reset OTP failed", {
      traceId,
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

export const updatePasswordAfterOTP = async (req, res) => {
  const traceId = getTraceId(req);
  const { email, newPassword } = req.body;
  if (!email || !newPassword)
    return res
      .status(400)
      .json({ error: "Email and new password are required" });

  try {
    const hashed = await bcrypt.hash(newPassword, 10);

    const [u, p, a] = await Promise.all([
      sql`SELECT id FROM users WHERE email = ${email}`,
      sql`SELECT id FROM providers WHERE email = ${email}`,
      sql`SELECT id FROM admins WHERE email = ${email}`,
    ]);

    let tableName;
    let userId = null;
    let role = null;
    if (u[0]) {
      tableName = "users";
      userId = u[0].id;
      role = "user";
    } else if (p[0]) {
      tableName = "providers";
      userId = p[0].id;
      role = "provider";
    } else if (a[0]) {
      tableName = "admins";
      userId = a[0].id;
      role = "admin";
    } else
      return res.status(404).json({ error: "Account not found" });

    await sql.query(
      `UPDATE ${tableName} SET password = $1, updated_at = NOW() WHERE email = $2`,
      [hashed, email]
    );

    await sql`
      DELETE FROM pending_registrations
      WHERE role = 'password_reset' AND email = ${email}
    `;

    logger.info("Password updated after OTP", {
      traceId,
      role,
      userId,
      email: maskEmail(email),
    });
    logAudit(userId, "PASSWORD_RESET_COMPLETED", {
      role,
      email: maskEmail(email),
    });

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    logger.error("Password update after OTP failed", {
      traceId,
      email: maskEmail(email),
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Failed to update password" });
  }
};

/* -------------------------------------------------------------------------- */
/* AUTHORIZED USER MANAGEMENT                                                 */
/* -------------------------------------------------------------------------- */

export const getAuthorizedUsers = async (req, res) => {
  const traceId = getTraceId(req);
  try {
    const { userId } = req.params;
    logger.info("Fetching authorized users", {
      traceId,
      userId,
    });

    const [user] =
      await sql`SELECT * FROM authorized_users WHERE client_id = ${userId}`;
    res.json({ success: true, data: user || null });
  } catch (err) {
    logger.error("Error fetching authorized user", {
      traceId,
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch authorized user.",
    });
  }
};

export const deleteAuthorizedUser = async (req, res) => {
  const traceId = getTraceId(req);
  try {
    const { authUserId } = req.params;
    logger.info("Deleting authorized user", {
      traceId,
      authorizedUserId: authUserId,
    });

    await sql`DELETE FROM authorized_users WHERE id = ${authUserId}`;

    logAudit(null, "AUTHORIZED_USER_DELETED", {
      authorizedUserId: authUserId,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error deleting authorized user", {
      traceId,
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      error: "Failed to remove authorized user.",
    });
  }
};
