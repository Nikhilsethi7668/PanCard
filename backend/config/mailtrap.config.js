const { MailtrapClient } = require("mailtrap");
const dotenv = require("dotenv");
dotenv.config();

// It's better to get these from environment variables
const TOKEN = process.env.MAILTRAP_TOKEN || "8d67e11c213af306cff2e5b461cc94e0";
const ENDPOINT =
  process.env.MAILTRAP_ENDPOINT || "https://send.api.mailtrap.io";

const client = new MailtrapClient({
  token: TOKEN,
  endpoint: ENDPOINT,
});

const sender = {
  email: "hello@grantshub.ca",
  name: "Mailtrap Test",
};

// Export if you're using this in other files
module.exports = {
  client,
  sender,
};
