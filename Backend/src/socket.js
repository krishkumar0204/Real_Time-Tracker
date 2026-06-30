const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("user-connected", socket.id);

    socket.on("send-location", (data) => {
      console.log(socket.id, data);
      io.emit("receive-location", {
        id: socket.id,
        ...data,
      });
    });

    socket.on("disconnect", () => {
      console.log("User-disconnected ", socket.id);
      io.emit("user-disconnected", socket.id);
    });
  });
};

export default initializeSocket;
