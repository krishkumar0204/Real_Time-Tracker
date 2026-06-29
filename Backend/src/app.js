import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import morgan from "morgan";
import config from "./config/server.config.js";
import initializeSocket from "./socket.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.FRONTED_URL,
    methods: ["GET", "POST"],
  },
});

// Initialize Socket.IO events
initializeSocket(io);

// Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default httpServer;
