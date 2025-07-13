import { NextFunction, Response, Request } from "express"
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

// @ts-ignore
export default function userMiddleware (req: Request, res: Response, next: NextFunction) {
     try {
          // @ts-ignore
          const authHeader = req.headers["authorization"];
          
          if (!authHeader) {
               res.status(401).json({ message: "Authorization header missing" });
               return;
          }

          // Extract token from "Bearer <token>" format
          const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
          
          // @ts-ignore
          const decoded = jwt.verify(token, JWT_SECRET); 

          if(decoded && typeof decoded !== "string") {
               // @ts-ignore
               req.userId = decoded.id;
               // @ts-ignore
               next();
          } else {
               res.status(401).json({ message: "Invalid token format" });
               return;
          }
     } catch (error) {
          console.error("Token verification failed:", error);
          res.status(401).json({ message: "Invalid or expired token" });
          return;
     }
}