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