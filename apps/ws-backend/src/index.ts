import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prisma } from "@repo/db/client";
import { z } from "zod";
import "dotenv/config";

// ============================================
// Message Validation Schemas
// ============================================

const JoinRoomSchema = z.object({
     type: z.literal("join_room"),
     roomId: z.string(),
});

const LeaveRoomSchema = z.object({
     type: z.literal("leave_room"),
     roomId: z.string(),
});

// Shape schemas for validation
const PointSchema = z.object({
     x: z.number(),
     y: z.number(),
});

const RectangleShapeSchema = z.object({
     id: z.string(),
     type: z.literal("rectangle"),
     x: z.number(),
     y: z.number(),
     width: z.number(),
     height: z.number(),
});

const CircleShapeSchema = z.object({
     id: z.string(),
     type: z.literal("circle"),
     centreX: z.number(),
     centreY: z.number(),
     radius: z.number(),
});

const PencilShapeSchema = z.object({
     id: z.string(),
     type: z.literal("pencil"),
     points: z.array(PointSchema),
});

const DiamondShapeSchema = z.object({
     id: z.string(),
     type: z.literal("diamond"),
     centerX: z.number(),
     centerY: z.number(),
     width: z.number(),
     height: z.number(),
});

const ArrowShapeSchema = z.object({
     id: z.string(),
     type: z.literal("arrow"),
     startX: z.number(),
     startY: z.number(),
     endX: z.number(),
     endY: z.number(),
});

const LineShapeSchema = z.object({
     id: z.string(),
     type: z.literal("line"),
     startX: z.number(),
     startY: z.number(),
     endX: z.number(),
     endY: z.number(),
});

const ShapeSchema = z.union([
     RectangleShapeSchema,
     CircleShapeSchema,
     PencilShapeSchema,
     DiamondShapeSchema,
     ArrowShapeSchema,
     LineShapeSchema,
]);

const ChatMessageSchema = z.object({
     type: z.literal("chat"),
     roomId: z.string(),
     message: z.string(),
});

const EraseMessageSchema = z.object({
     type: z.literal("erase"),
     roomId: z.string(),
     message: z.string(),
});

const MessageSchema = z.union([
     JoinRoomSchema,
     LeaveRoomSchema,
     ChatMessageSchema,
     EraseMessageSchema,
]);

// ============================================
// Server Configuration
// ============================================

const PORT = parseInt(process.env.WS_PORT || "8080", 10);
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

const wss = new WebSocketServer({ port: PORT });

interface User {
     ws: WebSocket;
     rooms: string[];
     userId: string;
     isAlive: boolean;
}

const users: User[] = [];

// ============================================
// Utility Functions
// ============================================

function checkUser(token: string): string | null {
     try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (typeof decoded === "string") {
               return null;
          }
          if (!decoded || (!decoded.userId && !decoded.id)) {
               return null;
          }
          return decoded.userId || decoded.id;
     } catch (e) {
          return null;
     }
}

function log(message: string, data?: unknown) {
     console.log(`[${new Date().toISOString()}] ${message}`, data || "");
}

function getUsersInRoom(roomId: string): User[] {
     return users.filter((u) => u.rooms.includes(roomId));
}

function broadcastToRoom(roomId: string, message: object, excludeWs?: WebSocket) {
     const roomUsers = getUsersInRoom(roomId);
     const messageStr = JSON.stringify(message);

     roomUsers.forEach((user) => {
          if (user.ws !== excludeWs && user.ws.readyState === WebSocket.OPEN) {
               user.ws.send(messageStr);
          }
     });
}

function removeUser(ws: WebSocket) {
     const index = users.findIndex((u) => u.ws === ws);
     if (index !== -1) {
          users.splice(index, 1);
     }
}

// ============================================
// Heartbeat for connection health
// ============================================

const heartbeatInterval = setInterval(() => {
     users.forEach((user) => {
          if (!user.isAlive) {
               log(`Terminating inactive connection for user: ${user.userId}`);
               user.ws.terminate();
               removeUser(user.ws);
               return;
          }
          user.isAlive = false;
          if (user.ws.readyState === WebSocket.OPEN) {
               user.ws.ping();
          }
     });
}, HEARTBEAT_INTERVAL);

wss.on("close", () => {
     clearInterval(heartbeatInterval);
});

// ============================================
// Connection Handler
// ============================================

wss.on("connection", function connection(ws, request) {
     const url = request.url;
     if (!url) {
          ws.close(4000, "Missing URL");
          return;
     }

     const queryParams = new URLSearchParams(url.split("?")[1]);
     const token = queryParams.get("token") || "";
     const userId = checkUser(token);

     if (userId === null) {
          ws.close(4001, "Authentication failed");
          return;
     }

     log(`User connected: ${userId}`);

     const user: User = {
          userId,
          rooms: [],
          ws,
          isAlive: true,
     };
     users.push(user);

     // Handle pong responses for heartbeat
     ws.on("pong", () => {
          user.isAlive = true;
     });

     ws.on("message", async function message(data) {
          try {
               const rawData = typeof data === "string" ? data : data.toString();
               const parsedData = JSON.parse(rawData);

               // Validate message format
               const validationResult = MessageSchema.safeParse(parsedData);
               if (!validationResult.success) {
                    log(`Invalid message format from user ${userId}:`, validationResult.error.flatten());
                    ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
                    return;
               }

               const validatedMessage = validationResult.data;

               // Handle join room
               if (validatedMessage.type === "join_room") {
                    if (!user.rooms.includes(validatedMessage.roomId)) {
                         user.rooms.push(validatedMessage.roomId);
                         log(`User ${userId} joined room: ${validatedMessage.roomId}`);

                         // Notify others in the room
                         broadcastToRoom(validatedMessage.roomId, {
                              type: "user_joined",
                              userId,
                              roomId: validatedMessage.roomId,
                         }, ws);
                    }
                    return;
               }

               // Handle leave room
               if (validatedMessage.type === "leave_room") {
                    user.rooms = user.rooms.filter((r) => r !== validatedMessage.roomId);
                    log(`User ${userId} left room: ${validatedMessage.roomId}`);

                    // Notify others in the room
                    broadcastToRoom(validatedMessage.roomId, {
                         type: "user_left",
                         userId,
                         roomId: validatedMessage.roomId,
                    });
                    return;
               }

               // Handle chat (drawing)
               if (validatedMessage.type === "chat") {
                    const roomId = validatedMessage.roomId;
                    const message = validatedMessage.message;

                    // Validate and sanitize the shape data
                    try {
                         const shapeData = JSON.parse(message);
                         const shapeValidation = z.object({ shape: ShapeSchema }).safeParse(shapeData);

                         if (!shapeValidation.success) {
                              log(`Invalid shape data from user ${userId}:`, shapeValidation.error.flatten());
                              ws.send(JSON.stringify({ type: "error", message: "Invalid shape format" }));
                              return;
                         }
                    } catch (e) {
                         log(`Failed to parse shape JSON from user ${userId}`);
                         ws.send(JSON.stringify({ type: "error", message: "Invalid shape JSON" }));
                         return;
                    }

                    // Save to database
                    await prisma.chat.create({
                         data: {
                              roomId: Number(roomId),
                              message,
                              userId,
                         },
                    });

                    // Broadcast to all users in the room (including sender for confirmation)
                    broadcastToRoom(roomId, {
                         type: "chat",
                         message,
                         roomId,
                    });
                    return;
               }

               // Handle erase
               if (validatedMessage.type === "erase") {
                    const roomId = validatedMessage.roomId;
                    const message = validatedMessage.message;

                    let shapesToErase: unknown[];
                    try {
                         const eraseData = JSON.parse(message);
                         shapesToErase = eraseData.shapesToErase;
                         if (!Array.isArray(shapesToErase)) {
                              throw new Error("shapesToErase must be an array");
                         }
                    } catch (e) {
                         log(`Invalid erase data from user ${userId}`);
                         ws.send(JSON.stringify({ type: "error", message: "Invalid erase format" }));
                         return;
                    }

                    log(`Erase request from ${userId}:`, { roomId, shapeCount: shapesToErase.length });

                    // Get all messages for this room
                    const allMessages = await prisma.chat.findMany({
                         where: { roomId: Number(roomId) },
                    });

                    // Find matching messages to delete
                    const messageIdsToDelete: number[] = [];

                    for (const shapeToErase of shapesToErase) {
                         if (typeof shapeToErase !== "object" || shapeToErase === null) continue;
                         const eraseShape = shapeToErase as Record<string, unknown>;

                         for (const dbMessage of allMessages) {
                              try {
                                   const dbShapeData = JSON.parse(dbMessage.message);
                                   const dbShape = dbShapeData.shape;
                                   if (!dbShape) continue;

                                   // Compare shapes by type and coordinates
                                   if (eraseShape.type !== dbShape.type) continue;

                                   let isMatch = false;
                                   switch (eraseShape.type) {
                                        case "rectangle":
                                             isMatch =
                                                  eraseShape.x === dbShape.x &&
                                                  eraseShape.y === dbShape.y &&
                                                  eraseShape.width === dbShape.width &&
                                                  eraseShape.height === dbShape.height;
                                             break;
                                        case "circle":
                                             isMatch =
                                                  eraseShape.centreX === dbShape.centreX &&
                                                  eraseShape.centreY === dbShape.centreY &&
                                                  eraseShape.radius === dbShape.radius;
                                             break;
                                        case "pencil":
                                             if (Array.isArray(eraseShape.points) && Array.isArray(dbShape.points)) {
                                                  if (eraseShape.points.length === dbShape.points.length) {
                                                       isMatch = (eraseShape.points as Array<{ x: number, y: number }>).every(
                                                            (point, index) =>
                                                                 point.x === dbShape.points[index].x &&
                                                                 point.y === dbShape.points[index].y
                                                       );
                                                  }
                                             }
                                             break;
                                        case "diamond":
                                             isMatch =
                                                  eraseShape.centerX === dbShape.centerX &&
                                                  eraseShape.centerY === dbShape.centerY &&
                                                  eraseShape.width === dbShape.width &&
                                                  eraseShape.height === dbShape.height;
                                             break;
                                        case "arrow":
                                        case "line":
                                             isMatch =
                                                  eraseShape.startX === dbShape.startX &&
                                                  eraseShape.startY === dbShape.startY &&
                                                  eraseShape.endX === dbShape.endX &&
                                                  eraseShape.endY === dbShape.endY;
                                             break;
                                   }

                                   if (isMatch && !messageIdsToDelete.includes(dbMessage.id)) {
                                        messageIdsToDelete.push(dbMessage.id);
                                   }
                              } catch (e) {
                                   // Skip malformed messages
                              }
                         }
                    }

                    // Delete matching messages
                    if (messageIdsToDelete.length > 0) {
                         const deleteResult = await prisma.chat.deleteMany({
                              where: { id: { in: messageIdsToDelete } },
                         });
                         log(`Deleted ${deleteResult.count} shapes from database`);
                    }

                    // Broadcast erase to all users in the room
                    broadcastToRoom(roomId, {
                         type: "erase",
                         message,
                         roomId,
                    });
               }
          } catch (error) {
               log(`Error processing message from user ${user.userId}:`, error);
               ws.send(JSON.stringify({ type: "error", message: "Internal server error" }));
          }
     });

     ws.on("close", () => {
          log(`User disconnected: ${userId}`);

          // Notify all rooms the user was in
          user.rooms.forEach((roomId) => {
               broadcastToRoom(roomId, {
                    type: "user_left",
                    userId,
                    roomId,
               });
          });

          removeUser(ws);
     });

     ws.on("error", (error) => {
          log(`WebSocket error for user ${userId}:`, error);
     });
});

// ============================================
// Graceful Shutdown
// ============================================

process.on("SIGTERM", () => {
     log("SIGTERM received. Closing WebSocket server...");
     wss.close(() => {
          log("WebSocket server closed.");
          process.exit(0);
     });
});

process.on("SIGINT", () => {
     log("SIGINT received. Closing WebSocket server...");
     wss.close(() => {
          log("WebSocket server closed.");
          process.exit(0);
     });
});

log(`WebSocket server started on port ${PORT}`);
