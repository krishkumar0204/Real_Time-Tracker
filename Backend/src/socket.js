const normalizeName = (name) => {
  if (typeof name !== "string") {
    return "Anonymous";
  }

  const normalizedName = name.trim().replace(/\s+/g, " ").slice(0, 40);

  return normalizedName || "Anonymous";
};

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("user-connected", socket.id);

    socket.on("send-location", (data) => {
      const latitude = Number(data.latitude);
      const longitude = Number(data.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return;
      }

      io.emit("receive-location", {
        id: socket.id,
        name: normalizeName(data.name),
        latitude,
        longitude,
      });
    });

    socket.on("disconnect", () => {
      console.log("User-disconnected ", socket.id);
      io.emit("user-disconnected", socket.id);
    });
  });
};

export default initializeSocket;
