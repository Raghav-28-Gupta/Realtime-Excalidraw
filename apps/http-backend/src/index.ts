import express from "express";
import { userRouter } from "./route/user";
import { roomRouter } from "./route/room";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/user", userRouter)
app.use("/room", roomRouter)


async function main() {
     app.listen(3001);
     console.log("app listening on port 3001")
}

main();