import express from "express";
import { userRouter } from "./route/user";
import { roomRouter } from "./route/room";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Load environment variables
import "dotenv/config";

const app = express();

// Security: HTTP security headers
app.use(helmet());

// Security: Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: { message: "Too many requests, please try again later." },
     standardHeaders: true,
     legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 20, // limit each IP to 20 auth requests per windowMs
     message: { message: "Too many authentication attempts, please try again later." },
     standardHeaders: true,
     legacyHeaders: false,
});

app.use(express.json({ limit: "10kb" })); // Limit body size
app.use(cors({
     origin: process.env.FRONTEND_URL || "http://localhost:3000",
     credentials: true,
}));

// Apply stricter rate limit to auth routes
app.use("/user", authLimiter, userRouter);
app.use("/room", roomRouter);

// Health check endpoint
app.get("/health", (req, res) => {
     res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

// Graceful shutdown handling
let server: ReturnType<typeof app.listen>;

async function main() {
     server = app.listen(PORT, () => {
          console.log(`[${new Date().toISOString()}] HTTP Backend listening on port ${PORT}`);
     });
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
     console.log("SIGTERM received. Shutting down gracefully...");
     server?.close(() => {
          console.log("Server closed.");
          process.exit(0);
     });
});

process.on("SIGINT", () => {
     console.log("SIGINT received. Shutting down gracefully...");
     server?.close(() => {
          console.log("Server closed.");
          process.exit(0);
     });
});

main();