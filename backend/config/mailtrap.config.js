import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";

dotenv.config();

const TOKEN ="8d67e11c213af306cff2e5b461cc94e0";
const ENDPOINT = "https://send.api.mailtrap.io";

export const client = new MailtrapClient({
  token: TOKEN,
  endpoint:ENDPOINT
});

export const sender = {
  email: "hello@grantshub.ca",
  name: "Mailtrap Test",
};

  