import { io } from "socket.io-client";

const normalizeApiUrl = (value) => {
  const trimmedValue = value.trim().replace(/\/$/, "");

  if (!trimmedValue || /^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmedValue)) {
    return `http://${trimmedValue}`;
  }

  return `https://${trimmedValue}`;
};

const apiUrl = normalizeApiUrl(
  import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "http://localhost:3000" : ""),
);

if (!apiUrl) {
  throw new Error("VITE_API_URL is required for production builds.");
}

const isLocalApiUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
  apiUrl,
);

if (import.meta.env.PROD && isLocalApiUrl) {
  throw new Error(
    "VITE_API_URL must point to the deployed backend in production, not localhost.",
  );
}

const socket = io(apiUrl, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on("connect_error", (error) => {
  console.error(`Socket connection failed for ${apiUrl}:`, error.message);
});

export default socket;
