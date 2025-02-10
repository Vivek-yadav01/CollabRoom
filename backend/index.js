const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const e = require("express");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("file");

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Only images, PDFs, and document files are allowed!");
  }
}

app.use(
  "/pdf.worker.mjs",
  express.static(
    path.join(__dirname, "node_modules/pdfjs-dist/build/pdf.worker.mjs")
  )
);

// Serve other static files (if needed)
app.use(express.static("public"));
app.use(
  express.static("public", {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Store active rooms and their data
const rooms = new Map();

// Handle file upload
app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err });
    } else {
      if (req.file == undefined) {
        res.status(400).json({ error: "No file selected!" });
      } else {
        const roomCode = req.body.roomCode;
        const room = rooms.get(roomCode);
        if (room) {
          const fileInfo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: `/uploads/${req.file.filename}`,
            type: path.extname(req.file.originalname).toLowerCase(),
          };
          if (!room.files) room.files = [];
          room.files.push(fileInfo);
          io.to(roomCode).emit("file-uploaded", fileInfo);
          console.log("File uploaded:", fileInfo);

          res.json(fileInfo);
        } else {
          res.status(404).json({ error: "Room not found" });
        }
      }
    }
  });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Create a new room
  socket.on("create-room", () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = {
      users: new Set([socket.id]),
      documents: new Map(),
      chat: [],
      files: [],
      activePdf: {
        filename: null,
        page: 1,
      },
      stroke: [],
    };
    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit("room-created", roomCode);
  });

  // Join existing room
  socket.on("join-room", (roomCode) => {
    console.log("User joining room:", roomCode);
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      room.users.add(socket.id);
      socket.join(roomCode);
      socket.emit("room-joined", room);
    } else {
      socket.emit("room-joined", { success: false, error: "Room not found" });
    }
  });

  // Handle document creation
  socket.on("create-document", ({ roomCode, docName, content }) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      if (room.documents.has(docName)) {
        docName = `${path.parse(docName).name}_${Date.now()}${
          path.parse(docName).ext
        }`;
      }
      room.documents.set(docName, content);
      io.to(roomCode).emit("document-created", { docName, content });
    }
  });

  // Handle document updates
  socket.on("update-document", ({ roomCode, docName, content }) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      room.documents.set(docName, content);
      socket.to(roomCode).emit("document-updated", { docName, content });
    }
  });

  // Handle PDF page changes
  socket.on("pdf-page-change", ({ roomCode, page, filename }) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      room.activePdf = { filename, page };
      io.to(roomCode).emit("pdf-page-updated", { page, filename });
    }
  });

  // Handle active PDF changes
  socket.on("pdf-file-change", ({ roomCode, filename }) => {
    console.log("PDF file change:", filename);
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      room.activePdf = { filename, page: 1 };
      io.to(roomCode).emit("pdf-file-updated", { filename });
    }
  });

  // Handle chat messages
  socket.on("send-message", ({ roomCode, message }) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      const chatMessage = {
        userId: socket.id,
        message,
        timestamp: Date.now(),
      };
      room.chat.push(chatMessage);
      io.to(roomCode).emit("new-message", chatMessage);
    }
  });

  // Handle whiteboard updates
  socket.on("send-stroke", ({ stroke, roomCode }) => {
    console.log("Whiteboard updated:", stroke);
    console.log("Room code:", roomCode);
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      const SEPARATOR = { type: "break" };

      if (stroke.length > 1) {
        room.stroke = [...room.stroke, SEPARATOR, ...stroke];
      } else {
        room.stroke = stroke;
      }

      socket.to(roomCode).emit("receive-stroke", stroke);
    } else {
      console.log("Room not found");
    }
  });

  // handling room data
  socket.on("fetch-room-data", ({ roomCode }) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      socket.emit("room-data", room);
    } else {
      socket.emit("room-data", { error: "Room not found" });
    }
  });

  // Delete file
  const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file at ${filePath}:`, err);
      } else {
        console.log(`File deleted successfully: ${filePath}`);
      }
    });
  };

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    rooms.forEach((room, roomCode) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        io.to(roomCode).emit("user-left", socket.id);
        if (room.users.size === 0) {
          // here we have to delete the uploaded file also
          if (room.files) {
            room.files.forEach((file) => {
              deleteFile(`public${file.path}`);
            });
          }

          rooms.delete(roomCode);
        }
      }
    });
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
