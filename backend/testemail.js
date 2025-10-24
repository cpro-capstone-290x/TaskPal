import { sendOTP } from "./config/mailer.js";

async function testMail() {
  const testEmail = "jcsinoy91@gmail.com";
  const testOTP = Math.floor(100000 + Math.random() * 900000);

  console.log("📨 Testing Brevo email send...");
  await sendOTP(testEmail, testOTP);
}

testMail();
