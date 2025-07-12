import { z } from "zod";

// User Schema
export const UserSchema = z.object({
  password: z.string(),
  name: z.string(),
  photo: z.string().url().optional(),
  email: z.string().email()
});

// Chat Schema (use z.lazy for circular reference)
// @ts-ignore
export const ChatSchema = z.object({
  id: z.number().int(),
  message: z.string(),
  roomId: z.number().int(),
  userId: z.string(),
  // Use z.lazy to reference RoomSchema after its declaration
  // @ts-ignore  
  room: z.lazy(() => RoomSchema),
  user: UserSchema,
});

// Room Schema (use z.lazy for chats)
// @ts-ignore
export const RoomSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  createdAt: z.date(),
  adminId: z.string(),
});