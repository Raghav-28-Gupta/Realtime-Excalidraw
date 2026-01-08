import { Request, Response, Router, type Router as ExpressRouter } from "express";
import userMiddleware from "../middleware/user";
import { RoomSchema } from "@repo/common/types";
import { prisma } from "@repo/db/client";


export const roomRouter: ExpressRouter = Router();

// @ts-ignore
roomRouter.post("", userMiddleware, async (req: Request, res: Response) => {
     // Only slug is expected from client, 
     // adminId comes from userMiddleware (req.userId)
     const CreateRoomSchema = RoomSchema.omit({ id: true, createdAt: true, adminId: true });
     const dataPassed = CreateRoomSchema.safeParse(req.body);

     if (!dataPassed.success) {
          return res.status(400).json({ message: "Incorrect Format" });
     }

     const { slug } = req.body;
     // @ts-ignore
     const adminId = req.userId;

     const existingRoomName = await prisma.room.findFirst({ where: { slug, adminId } });
     if (existingRoomName) {
          return res.status(400).json({
               message: "Select a different room name"
          });
     }

     try {
          const room = await prisma.room.create({
               data: {
                    slug,
                    adminId,
               },
          });

          res.status(201).json({ message: "Room created successfully", room });
     } catch (error) {
          res.status(500).json({ message: "Failed to create room", error: error instanceof Error ? error.message : error });
     }
})

roomRouter.get("/chat/:roomId", async (req: Request, res: Response) => {
     const roomId = Number(req.params.roomId);
     try {
          const messages = await prisma.chat.findMany({
               where: {
                    roomId
               },
               orderBy: {
                    id: "desc"
               },
               take: 1000
          });

          res.json({
               messages
          });
     } catch (error) {
          console.error("Invalid roomId", error);
          res.json({
               message: "Invalid roomId"
          })
     }
})


roomRouter.get("/room/:slug", async (req: Request, res: Response) => {
     const slug = req.params.slug;
     try {
          const room = await prisma.room.findFirst({
               where: {
                    slug
               }
          });

          res.json({
               room
          });
     } catch (error) {
          console.error("Invalid slug", error);
          res.json({
               message: "Invalid slug"
          })
     }
})

// @ts-ignore
roomRouter.post("/validate-room", async (req: Request, res: Response) => {
     const { roomId, roomName } = req.body;

     if (!roomId || !roomName) {
          return res.status(400).json({
               message: "Both room ID and room name are required"
          });
     }

     try {
          const room = await prisma.room.findFirst({
               where: {
                    id: Number(roomId),
                    slug: roomName
               }
          });

          if (!room) {
               return res.status(404).json({
                    message: "Room not found or room ID and name do not match"
               });
          }

          res.json({
               room,
               message: "Room validated successfully"
          });
     } catch (error) {
          console.error("Room validation error:", error);
          res.status(500).json({
               message: "Failed to validate room"
          });
     }
})

// Get user's rooms (requires authentication)
// @ts-ignore
roomRouter.get("/my-rooms", userMiddleware, async (req: Request, res: Response) => {
     try {
          // @ts-ignore
          const userId = req.userId;

          const rooms = await prisma.room.findMany({
               where: { adminId: userId },
               orderBy: { createdAt: "desc" },
               select: {
                    id: true,
                    slug: true,
                    createdAt: true,
                    _count: {
                         select: { chats: true }
                    }
               }
          });

          res.json({
               rooms: rooms.map(room => ({
                    id: room.id,
                    slug: room.slug,
                    createdAt: room.createdAt,
                    shapeCount: room._count.chats
               }))
          });
     } catch (error) {
          console.error("Failed to get user rooms:", error);
          res.status(500).json({ message: "Failed to get rooms" });
     }
});

// Get single room by ID
roomRouter.get("/id/:roomId", async (req: Request, res: Response) => {
     try {
          const roomId = Number(req.params.roomId);

          if (isNaN(roomId)) {
               res.status(400).json({ message: "Invalid room ID" });
               return;
          }

          const room = await prisma.room.findUnique({
               where: { id: roomId },
               select: {
                    id: true,
                    slug: true,
                    createdAt: true,
                    admin: {
                         select: { name: true }
                    }
               }
          });

          if (!room) {
               res.status(404).json({ message: "Room not found" });
               return;
          }

          res.json({ room });
     } catch (error) {
          console.error("Failed to get room:", error);
          res.status(500).json({ message: "Failed to get room" });
     }
});