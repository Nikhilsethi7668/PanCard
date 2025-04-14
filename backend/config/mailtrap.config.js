const { MailtrapClient } = require("mailtrap");
const dotenv = require("dotenv");
dotenv.config();

const client = new MailtrapClient({
  token: process.env.MAILTRAP_TOKEN || "8d67e11c213af306cff2e5b461cc94e0",
  endpoint: process.env.MAILTRAP_ENDPOINT || "https://send.api.mailtrap.io",
});

const sender = {
  email: "hello@grantshub.ca",
  name: "Mailtrap Test",
};

// Test the connection immediately
(async () => {
  try {
    await client.send({
      from: sender,
      to: [{ email: "test@example.com" }],
      subject: "Mailtrap Connection Test",
      text: "This is a test email to verify Mailtrap connection",
    });
    console.log("✅ Mailtrap connection verified");
  } catch (error) {
    console.error("❌ Mailtrap connection failed:", error);
  }
})();

module.exports = {
  client,
  sender,
};
