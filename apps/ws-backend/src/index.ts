import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prisma } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

function checkUser(token: string): string | null {
     try {
     const decoded = jwt.verify(token, JWT_SECRET);

     if (typeof decoded == "string") {
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

wss.on("connection", function connection(ws, request) {
     const url = request.url;
     if (!url) {
          return;
     }
     const queryParams = new URLSearchParams(url.split("?")[1]);
     const token = queryParams.get("token") || "";
     const userId = checkUser(token);

     if (userId == null) {
          ws.close();
          return null;
     }

     users.push({
          userId,
          rooms: [],
          ws,
     });

     ws.on("message", async function message(data) {
          let parsedData;
          if (typeof data !== "string") {
               parsedData = JSON.parse(data.toString());
          } else {
               parsedData = JSON.parse(data); // {type: "join-room", roomId: 1}
          }
          
          if (parsedData.type === "join_room") {
               const user = users.find((x) => x.ws === ws);
               user?.rooms.push(parsedData.roomId);
          }

          if (parsedData.type === "leave_room") {
               const user = users.find((x) => x.ws === ws);
               if (!user) {
                    return;
               }
               user.rooms = user?.rooms.filter((x) => x === parsedData.room);
          }

          console.log("message received");
          console.log(parsedData);

          if (parsedData.type === "chat") {
               const roomId = parsedData.roomId;
               const message = parsedData.message;

               await prisma.chat.create({
                    data: {
                         roomId: Number(roomId),
                         message,
                         userId,
                    },
               });

               users.forEach((user) => {
                    if (user.rooms.includes(roomId)) {
                              user.ws.send(
                              JSON.stringify({
                                   type: "chat",
                                   message: message,
                                   roomId,
                              })
                         );
                    }
               });
          }

          if (parsedData.type === "erase") {
               const roomId = parsedData.roomId;
               const message = parsedData.message;
               const shapesToErase = JSON.parse(message).shapesToErase;

               console.log("Erase request received:", { roomId, shapesToErase });

               // Deleting the erased shapes from database
               for (const shapeToErase of shapesToErase) {
                    console.log(`Attempting to delete shape:`, shapeToErase);
                    
                    // Get fresh messages for this room (to avoid race conditions)
                    const allMessages = await prisma.chat.findMany({
                         where: {
                              roomId: Number(roomId)
                         }
                    });
                    
                    // Find matching messages in the database
                    const messagesToDelete = allMessages.filter(dbMessage => {
                         try {
                              const dbShape = JSON.parse(dbMessage.message).shape;
                              console.log("Comparing shapes:", { shapeToErase, dbShape });
                              
                              // Comparing by shape properties (ignore IDs since old shapes don't have them)
                              if (shapeToErase.type !== dbShape.type) return false;
                              
                              if (shapeToErase.type === "rectangle" && dbShape.type === "rectangle") {
                                   const match = shapeToErase.x === dbShape.x && 
                                        shapeToErase.y === dbShape.y && 
                                        shapeToErase.width === dbShape.width && 
                                        shapeToErase.height === dbShape.height;
                                   console.log("Rectangle match:", match);
                                   return match;
                              } else if (shapeToErase.type === "circle" && dbShape.type === "circle") {
                                   const match = shapeToErase.centreX === dbShape.centreX && 
                                        shapeToErase.centreY === dbShape.centreY && 
                                        shapeToErase.radius === dbShape.radius;
                                   console.log("Circle match:", match);
                                   return match;
                              } else if (shapeToErase.type === "pencil" && dbShape.type === "pencil") {
                                   if (shapeToErase.points.length !== dbShape.points.length) return false;
                                   const match = shapeToErase.points.every((point: any, index: number) => 
                                        point.x === dbShape.points[index].x && point.y === dbShape.points[index].y
                                   );
                                   console.log("Pencil match:", match);
                                   return match;
                              } else if (shapeToErase.type === "diamond" && dbShape.type === "diamond") {
                                   const match = shapeToErase.centerX === dbShape.centerX && 
                                        shapeToErase.centerY === dbShape.centerY && 
                                        shapeToErase.width === dbShape.width && 
                                        shapeToErase.height === dbShape.height;
                                   console.log("Diamond match:", match);
                                   return match;
                              } else if (shapeToErase.type === "arrow" && dbShape.type === "arrow") {
                                   const match = shapeToErase.startX === dbShape.startX && 
                                        shapeToErase.startY === dbShape.startY && 
                                        shapeToErase.endX === dbShape.endX && 
                                        shapeToErase.endY === dbShape.endY;
                                   console.log("Arrow match:", match);
                                   return match;
                              } else if (shapeToErase.type === "line" && dbShape.type === "line") {
                                   const match = shapeToErase.startX === dbShape.startX && 
                                        shapeToErase.startY === dbShape.startY && 
                                        shapeToErase.endX === dbShape.endX && 
                                        shapeToErase.endY === dbShape.endY;
                                   console.log("Line match:", match);
                                   return match;
                              }
                              
                              return false;
                         } catch (e) {
                              console.error("Error parsing message:", e);
                              return false;
                         }
                    });

                    console.log(`Found ${messagesToDelete.length} messages to delete`);

                    // Deleting the matching messages (using deleteMany to avoid errors if record doesn't exist)
                    if (messagesToDelete.length > 0) {
                         const messageIds = messagesToDelete.map(msg => msg.id);
                         try {
                              const deleteResult = await prisma.chat.deleteMany({
                                   where: {
                                        id: {
                                             in: messageIds
                                        }
                                   }
                              });
                              console.log(`Successfully deleted ${deleteResult.count} messages for shape`);
                         } catch (error) {
                              console.error(`Error deleting messages:`, error);
                         }
                    } else {
                         console.log(`No matching messages found to delete for shape`);
                    }
               }

               users.forEach((user) => {
                    if (user.rooms.includes(roomId)) {
                         user.ws.send(
                              JSON.stringify({
                                   type: "erase",
                                   message: message,
                                   roomId,
                              })
                         );
                    }
               });
          }
     });
});
