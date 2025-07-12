import { NextFunction, Response, Request } from "express"
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

// @ts-ignore
export default function userMiddleware (req: Request, res: Response, next: NextFunction) : void {
     // @ts-ignore
     const headers = req.headers["authorization"];
     // @ts-ignore
     const decoded = jwt.verify(headers as string, JWT_SECRET); 

     if(decoded) {
          if(typeof decoded !== "string") {
               // @ts-ignore
               req.userId = decoded.id;
               // @ts-ignore
               next();
          }
     } else{
          console.log("Invalid or expired token")
     }
}