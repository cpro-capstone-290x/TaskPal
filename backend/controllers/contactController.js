// controllers/contactController.js
import apiInstance from "../mailer.js"; // ✅ use the centralized instance
import Brevo from "@getbrevo/brevo";
import { sendContactMessage } from "../config/mailer.js";
import dotenv from "dotenv";
dotenv.config();

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required." });
    }

    const supportEmail = process.env.SUPPORT_EMAIL; 
    const emailUser = process.env.EMAIL_USER; 

    // ✅ Build email using Brevo SDK
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: "TaskPal", email: emailUser };
    sendSmtpEmail.to = [{ email: supportEmail, name: "TaskPal Support" }];
    sendSmtpEmail.subject = `📩 New Contact Message from ${name}`;
    sendSmtpEmail.htmlContent = `
      <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; 
             box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
          <h1 style="color: #0077cc; text-align: center;">TaskPal Support Message</h1>
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Message:</strong></p>
          <p style="background-color:#f8f9fa; padding:15px; border-radius:8px; color:#555;">
            ${message.replace(/\n/g, "<br>")}
          </p>
          <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">
          <p style="font-size:13px; color:#777; text-align:center;">
            This message was sent via the TaskPal Contact Form.
          </p>
        </div>
      </div>
    `;

    // ✅ Send email using shared Brevo instance
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("📬 Contact form email sent successfully:", response);

    res.json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending contact email:", error.response?.text || error.message);
    res.status(500).json({
      success: false,
      error: "Failed to send message. Please try again later.",
    });
  }
};
