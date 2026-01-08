import { Request, Response, Router, type Router as ExpressRouter } from "express";
import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRY, BCRYPT_ROUNDS } from "@repo/backend-common/config";
import { UserSchema } from "@repo/common/types";
import { prisma } from "@repo/db/client";

// @ts-ignore
export const userRouter: ExpressRouter = Router();

userRouter.post("/signup", async (req: Request, res: Response) => {
     try {
          const dataPassed = UserSchema.safeParse(req.body);
          if (!dataPassed.success) {
               res.status(400).json({
                    message: "Invalid input format",
                    errors: dataPassed.error.flatten().fieldErrors,
               });
               return;
          }

          const { name, password, email } = dataPassed.data;

          // Check if user exists
          const existingUser = await prisma.user.findUnique({ where: { email } });
          if (existingUser) {
               res.status(409).json({
                    message: "Email already registered",
               });
               return;
          }

          // Hash password with secure rounds (default: 12)
          const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

          const user = await prisma.user.create({
               data: {
                    name,
                    email: email.toLowerCase().trim(),
                    password: hashedPassword,
               },
          });

          // Auto-login after signup: return token
          const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

          res.status(201).json({
               message: "User created successfully",
               token,
          });
     } catch (error) {
          console.error("Signup error:", error);
          res.status(500).json({ message: "Internal server error" });
     }
});

// Signin Schema
const SigninSchema = z.object({
     password: z.string().min(1, "Password is required"),
     email: z.string().email("Invalid email format"),
});

userRouter.post("/signin", async (req: Request, res: Response) => {
     try {
          const dataPassed = SigninSchema.safeParse(req.body);
          if (!dataPassed.success) {
               res.status(400).json({
                    message: "Invalid input format",
                    errors: dataPassed.error.flatten().fieldErrors,
               });
               return;
          }

          const { password, email } = dataPassed.data;

          // Find user (normalize email)
          const existingUser = await prisma.user.findUnique({
               where: { email: email.toLowerCase().trim() },
          });

          if (!existingUser) {
               // Use vague message to prevent user enumeration
               res.status(401).json({
                    message: "Invalid email or password",
               });
               return;
          }

          const matchPassword = await bcrypt.compare(password, existingUser.password);
          if (!matchPassword) {
               // Same message to prevent user enumeration
               res.status(401).json({
                    message: "Invalid email or password",
               });
               return;
          }

          // Generate token with expiry
          const token = jwt.sign({ id: existingUser.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

          res.json({
               token,
               user: {
                    id: existingUser.id,
                    name: existingUser.name,
                    email: existingUser.email,
               },
          });
     } catch (error) {
          console.error("Signin error:", error);
          res.status(500).json({ message: "Internal server error" });
     }
});

// Validate token endpoint - checks if JWT is still valid
// @ts-ignore
userRouter.get("/validate", async (req: Request, res: Response) => {
     try {
          const authHeader = req.headers["authorization"];

          if (!authHeader) {
               res.status(401).json({ valid: false, message: "No token provided" });
               return;
          }

          const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

          const decoded = jwt.verify(token, JWT_SECRET);

          if (decoded && typeof decoded !== "string") {
               // Token is valid, optionally fetch user info
               const user = await prisma.user.findUnique({
                    where: { id: (decoded as { id: string }).id },
                    select: { id: true, name: true, email: true }
               });

               if (user) {
                    res.json({ valid: true, user });
               } else {
                    res.status(401).json({ valid: false, message: "User not found" });
               }
          } else {
               res.status(401).json({ valid: false, message: "Invalid token" });
          }
     } catch (error) {
          console.error("Token validation error:", error);
          res.status(401).json({ valid: false, message: "Invalid or expired token" });
     }
});