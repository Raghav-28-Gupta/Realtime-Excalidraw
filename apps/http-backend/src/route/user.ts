import { Request, Response, Router, type Router as ExpressRouter } from "express";
import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { UserSchema } from "@repo/common/types";
import { prisma } from "@repo/db/client";

// @ts-ignore
export const userRouter: ExpressRouter = Router();   

userRouter.post("/signup", async (req: Request, res: Response) => {
     const dataPassed = UserSchema.safeParse(req.body);
     if(!dataPassed.success) {
          res.status(403).json({
               message: "Incorrect Format"
          });
          return;
     }

     const { name, password, email } = req.body;
     const existingUser = await prisma.user.findUnique({ where: { email } });
     if(existingUser) {
          res.json({
               message: "email already used"
          })
          return;
     }

     const hashedPassword = await bcrypt.hash(password, 5);

     await prisma.user.create({
          data: {
               name, 
               email,
               password: hashedPassword,
          }
     })

     res.json({
          message: "User created successfully"
     });
})


// Resolved SigninSchema
const SigninSchema = z.object({
  password: z.string(),
  email: z.string().email()
});

userRouter.post("/signin", async(req: Request, res: Response) => {
     const dataPassed = SigninSchema.safeParse(req.body);
     if(!dataPassed.success) {
          res.status(403).json({
               message: "Incorrect Format"
          });
          return;
     }

     const { password, email } = req.body;
     const existingUser = await prisma.user.findUnique({ where : { email } })
     if (!existingUser) {
          res.status(404).json({
               message: "User not found"
          });
          return;
     }
     const matchPassword = await bcrypt.compare(password, existingUser.password);
     if(!matchPassword) {
          res.json({
               message: "Wrong Password"
          })
          return;
     }

     const token = jwt.sign({ id: existingUser.id}, JWT_SECRET);
     res.json({
          token: token
     })
})