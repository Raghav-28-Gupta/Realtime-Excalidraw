"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  return (
    <div
      style={{
        backgroundColor: "black",
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f6fa",
      }}
    >
      <div
        style={{
          padding: "2rem 3rem",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <input
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid #dcdde1",
            fontSize: "1rem",
            outline: "none",
            width: "220px",
            marginBottom: "0.5rem",
          }}
          type="text"
          placeholder="Room Id"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            border: "none",
            background: "#4f8cff",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onClick={() => {
            if (roomId.trim()) {
              router.push(`/room/${roomId}`);
            }
          }}
          disabled={!roomId.trim()}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}