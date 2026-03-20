require("dotenv").config();

const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDB();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next();
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      return next();
    } catch (error) {
      return next();
    }
  });

  io.on("connection", (socket) => {
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
      socket.join(`role:${socket.user.role}`);
    }

    socket.on("joinTicket", (ticketId) => {
      if (ticketId) {
        socket.join(`ticket:${ticketId}`);
      }
    });
  });

  app.set("io", io);

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});
