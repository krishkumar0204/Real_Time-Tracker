import dotenv from "dotenv";
dotenv.config();

if (!process.env.PORT) {
  throw new Error("PORT is not defined in Environment variable");
}

if (!process.env.FRONTED_URL) {
  throw new Error("FRONTED_URL is not defined in Environment variable");
}
const config = {
  PORT: process.env.PORT,
  FRONTED_URL: process.env.FRONTED_URL,
};

export default config;
