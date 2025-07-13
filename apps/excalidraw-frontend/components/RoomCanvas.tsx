"use client";
import { WS_URL } from "@/config";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
     const [socket, setSocket] = useState<WebSocket | null>(null);
     const [isOpen, setIsOpen] = useState(false);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
          console.log("Attempting WebSocket connection...");
          const token = localStorage.getItem('token');
          if (!token) {
               console.error("No authentication token found");
               setError("Authentication required. Please sign in again.");
               return;
          }
          
          const ws = new WebSocket(
          `${WS_URL}?token=${token}`
          );

     ws.onopen = () => {
     console.log("WebSocket opened!");
     setSocket(ws);
     setIsOpen(true);
     const data = JSON.stringify({
          type: "join_room",
          roomId,
     });
     ws.send(data);
     };

     ws.onclose = (event) => {
          console.warn("WebSocket closed", event);
          setIsOpen(false);
          setSocket(null);
     };

     ws.onerror = (err) => {
          console.error("WebSocket error", err);
          setIsOpen(false);
          setSocket(null);
     };

     return () => {
          ws.close();
          };
     }, [roomId]);

     if (error) {
          return (
               <div className="flex items-center justify-center min-h-screen bg-red-50">
                    <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                         <p className="text-red-600 mb-4">{error}</p>
                         <button 
                              onClick={() => window.location.href = '/'}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                         >
                              Go to Home
                         </button>
                    </div>
               </div>
          );
     }

     if (!socket || !isOpen) {
          return <div>Connecting to server....</div>;
     }

     return (
     <div>
          <Canvas roomId={roomId} socket={socket} />
     </div>
  );
}