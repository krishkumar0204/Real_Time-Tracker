import dotenv from "dotenv";
dotenv.config();

if (!process.env.PORT) {
  throw new Error("PORT is not defined in Environment variable");
}

const frontendUrl = process.env.FRONTEND_URL || process.env.FRONTED_URL;

if (!frontendUrl) {
  throw new Error("FRONTEND_URL is not defined in Environment variable");
}

const config = {
  PORT: process.env.PORT,
  FRONTEND_URL: frontendUrl,
  CORS_ORIGINS: frontendUrl.split(",").map((origin) => origin.trim()),
};

export default config;
