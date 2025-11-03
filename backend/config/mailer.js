import Brevo from "@getbrevo/brevo";
import dotenv from "dotenv";
import send from "send";
dotenv.config();

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

export async function sendOTP(email, otp) {
  try{
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "Your OTP Code";
    sendSmtpEmail.htmlContent = `
      <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; 
             box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); max-width: 450px; margin: 0 auto;">
          <h1 style="color: #0077cc; text-align: center;">TaskPal</h1>
          <p style="font-size: 16px; color: #333;">
            Hello, 
          </p>
          <p style="font-size: 16px; color: #333;">
            Your One-Time Password (OTP) is:
          </p>
          <p style="font-size: 28px; color: #0077cc; font-weight: bold; text-align: center; letter-spacing: 2px;">
            ${otp}
          </p>
          <p style="font-size: 14px; color: #555; text-align: center;">
            This OTP will expire in <strong>10 minutes</strong>.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 14px; color: #555; text-align: center;">
            If you didn’t request this code, please ignore this email.
          </p>
          <p style="font-size: 14px; color: #333; text-align: center;">
            Thank you for using <strong>TaskPal</strong>.
          </p>
        </div>
      </div>
    `;
     sendSmtpEmail.sender = { name: "TaskPal", email: "capstonerdp@gmail.com" };
     sendSmtpEmail.to = [{ email }];

     const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
     console.log("OTP email sent successfully:", response);
  } catch (error) {
    console.error("❌ Error sending OTP email:", error.response?.text || error.message);
  }
 
}

// =============================
// 📩 SEND CONTACT MESSAGE
// =============================
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

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: "TaskPal", email: emailUser };
    sendSmtpEmail.to = [{ email: supportEmail, name: "TaskPal Support" }];
    sendSmtpEmail.bcc = [{ email: "johncarlo.sinoy@rdpolytech.ca" }]; // ✅ BCC for monitoring
    sendSmtpEmail.replyTo = { email, name }; // ✅ allows direct reply to sender
    sendSmtpEmail.subject = `📩 New Contact Message from ${name}`;
    sendSmtpEmail.htmlContent = `
      <div style="background-color:#f4f4f4;padding:20px;font-family:Arial,sans-serif;">
        <div style="background-color:#ffffff;padding:25px;border-radius:10px;
             box-shadow:0 0 10px rgba(0,0,0,0.1);max-width:500px;margin:0 auto;">
          <h1 style="color:#0077cc;text-align:center;">TaskPal Support Message</h1>
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Message:</strong></p>
          <p style="background-color:#f8f9fa;padding:15px;border-radius:8px;color:#555;">
            ${message.replace(/\n/g, "<br>")}
          </p>
          <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
          <p style="font-size:13px;color:#777;text-align:center;">
            This message was sent via the TaskPal Contact Form.
          </p>
        </div>
      </div>
    `;

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