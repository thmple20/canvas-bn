// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import cors from "cors";

// const app = express();
// app.use(cors());

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
// });

// // Store the latest scene per room
// const roomScenes = {};

// io.on("connection", (socket) => {
//   console.log("✅ User connected:", socket.id);

//   // Join a room
//   socket.on("joinRoom", (roomId) => {
//     socket.join(roomId);
//     console.log(`${socket.id} joined room ${roomId}`);

//     // Send latest scene to new user
//     if (roomScenes[roomId]) {
//       socket.emit("drawing", roomScenes[roomId]);
//     }
//   });

//   // Receive drawing updates
//   socket.on("drawing", ({ roomId, elements, appState }) => {
//     // Save latest scene
//     roomScenes[roomId] = { elements, appState };
//     // Broadcast to others in the room
//     socket.to(roomId).emit("received-drawing", { elements, appState });
//     console.log("🖌️ Drawing updated in room:", roomId, "by:", socket.id);
//   });

//   socket.on("disconnect", () => {
//     console.log("❌ User disconnected:", socket.id);
//   });
// });

// server.listen(4003, () => {
//   console.log("🚀 Server running on http://localhost:4003");
// });











import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  maxHttpBufferSize: 1e8, // 100 MB - allows large images
});

// Store the latest scene per room (including files)
const roomScenes = {};

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // Join a room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    // Send latest scene to new user (including files)
    if (roomScenes[roomId]) {
      socket.emit("received-drawing", roomScenes[roomId]);
      console.log(
        `📤 Sent existing scene to ${socket.id}:`,
        "Elements:",
        roomScenes[roomId].elements?.length || 0,
        "Files:",
        Object.keys(roomScenes[roomId].files || {}).length
      );
    }
  });

  // Receive drawing updates (now with files)
  socket.on("drawing", ({ roomId, elements, appState, files }) => {
    // Merge files with existing files (don't lose old images)
    const existingFiles = roomScenes[roomId]?.files || {};
    const mergedFiles = { ...existingFiles, ...files };

    // Save latest scene with files
    roomScenes[roomId] = {
      elements,
      appState,
      files: mergedFiles,
      roomId,
    };

    // Broadcast to others in the room (including files)
    socket.to(roomId).emit("received-drawing", {
      elements,
      appState,
      files: mergedFiles,
      roomId,
    });

    console.log(
      "🖌️ Drawing updated in room:",
      roomId,
      "by:",
      socket.id,
      "| Elements:",
      elements.length,
      "| Files:",
      Object.keys(mergedFiles).length
    );
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(4004, () => {
  console.log("🚀 Server running on http://localhost:4003");
});
