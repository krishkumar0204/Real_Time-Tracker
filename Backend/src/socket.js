const normalizeName = (name) => {
  if (typeof name !== "string") {
    return "Anonymous";
  }

  const normalizedName = name.trim().replace(/\s+/g, " ").slice(0, 40);

  return normalizedName || "Anonymous";
};

const activeUsers = new Map();

const getActiveUsers = () => Array.from(activeUsers.values());

const createLocationPayload = (socketId, data) => {
  const latitude = Number(data?.latitude);
  const longitude = Number(data?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    id: socketId,
    name: normalizeName(data.name),
    latitude,
    longitude,
    updatedAt: Date.now(),
  };
};

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("user-connected", socket.id);

    socket.emit("active-users", getActiveUsers());
    socket.broadcast.emit("request-location");

    socket.on("get-active-users", () => {
      socket.emit("active-users", getActiveUsers());
    });

    socket.on("send-location", (data) => {
      const location = createLocationPayload(socket.id, data);

      if (!location) {
        return;
      }

      activeUsers.set(socket.id, location);
      io.emit("receive-location", location);
    });

    socket.on("disconnect", () => {
      console.log("User-disconnected ", socket.id);
      activeUsers.delete(socket.id);
      io.emit("user-disconnected", socket.id);
    });
  });
};

export default initializeSocket;
