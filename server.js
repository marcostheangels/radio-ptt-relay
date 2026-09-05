const port = process.env.PORT || 3000;
const io = require("socket.io")(port, {
  cors: { origin: "*" }
});

console.log("PTT Server running on port " + port);

const activeSpeakers = {};
const connectedUsers = new Map();

io.on("connection", (socket) => {
  const roomName = "SALA_UNICA_PTT";

  socket.on("join", (userName) => {
    socket.join(roomName);
    const name = userName || `User_${socket.id.substring(0, 4)}`;
    connectedUsers.set(socket.id, name);
    io.to(roomName).emit("user_list", Array.from(connectedUsers.values()));
    if (activeSpeakers[roomName]) {
      socket.emit("speaker_started", activeSpeakers[roomName]);
    }
  });

  socket.on("start_talk", () => {
    if (!activeSpeakers[roomName]) {
      activeSpeakers[roomName] = socket.id;
      io.to(roomName).emit("speaker_started", socket.id);
    }
  });

  socket.on("stop_talk", () => {
    if (activeSpeakers[roomName] === socket.id) {
      delete activeSpeakers[roomName];
      io.to(roomName).emit("speaker_ended", socket.id);
    }
  });

  socket.on("audio_data", (data) => {
    if (activeSpeakers[roomName] === socket.id) {
      socket.to(roomName).emit("audio_data", data);
    }
  });

  socket.on("disconnect", () => {
    connectedUsers.delete(socket.id);
    if (activeSpeakers[roomName] === socket.id) {
      delete activeSpeakers[roomName];
      io.to(roomName).emit("speaker_ended", socket.id);
    }
    io.to(roomName).emit("user_list", Array.from(connectedUsers.values()));
  });
});
