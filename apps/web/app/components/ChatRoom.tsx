import axios from "axios";
import { BACKEND_URL } from "../config";
import { ChatRoomClient } from "./ChatRoomClient";

async function getMessges( roomId: string ) {
     const response = axios.get(`${BACKEND_URL}/chat/:${roomId}`);
     return (await response).data.messages;
}

export default async function ChatRoom({ id } : { id : string }) {
     const messages = await getMessges(id);
     return <ChatRoomClient id={id} messages={messages} />
}