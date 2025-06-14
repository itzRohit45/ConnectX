// This is a quick debugging page to help isolate chat issues
// Place this in /pages/debug-chat.jsx

import React, { useEffect, useState } from "react";
import { BASE_URL } from "@/config";
import { io } from "socket.io-client";
import UserLayout from "@/layout/userLayout";

export default function DebugChat() {
  const [status, setStatus] = useState("Disconnected");
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Get user info from localStorage
    const token = localStorage.getItem("token");
    setToken(token || "No token found");

    // Test direct API access
    const testAPI = async () => {
      try {
        setMessages((prev) => [...prev, "Testing API connection..."]);
        const response = await fetch(
          `${BASE_URL}/chat/conversations?token=${token}`
        );

        if (response.ok) {
          const data = await response.json();
          setMessages((prev) => [
            ...prev,
            `API connection successful: ${JSON.stringify(data)}`,
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            `API connection failed: ${response.status} ${response.statusText}`,
          ]);
          const text = await response.text();
          setMessages((prev) => [...prev, `Response: ${text}`]);
        }
      } catch (error) {
        setMessages((prev) => [...prev, `API error: ${error.message}`]);
      }
    };

    // Test socket connection
    const testSocket = () => {
      try {
        setMessages((prev) => [...prev, "Testing socket connection..."]);
        const socket = io(BASE_URL, {
          transports: ["websocket", "polling"],
          reconnectionAttempts: 3,
        });

        socket.on("connect", () => {
          setStatus(`Connected: ${socket.id}`);
          setMessages((prev) => [...prev, `Socket connected: ${socket.id}`]);
        });

        socket.on("connect_error", (err) => {
          setStatus(`Error: ${err.message}`);
          setMessages((prev) => [
            ...prev,
            `Socket connect error: ${err.message}`,
          ]);
        });

        socket.on("disconnect", (reason) => {
          setStatus(`Disconnected: ${reason}`);
          setMessages((prev) => [...prev, `Socket disconnected: ${reason}`]);
        });

        // Cleanup function
        return () => {
          socket.disconnect();
        };
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          `Socket setup error: ${error.message}`,
        ]);
      }
    };

    // Only run these tests if we have a token
    if (token) {
      testAPI();
      testSocket();
    }
  }, []);

  return (
    <UserLayout>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h1>Chat Debugging</h1>

        <div style={{ marginBottom: "20px" }}>
          <h2>Socket Status</h2>
          <p>
            <strong>Status:</strong> {status}
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h2>User Info</h2>
          <p>
            <strong>Token:</strong>{" "}
            {token ? token.substring(0, 10) + "..." : "None"}
          </p>
        </div>

        <div>
          <h2>Debug Log</h2>
          <div
            style={{
              background: "#f5f5f5",
              padding: "10px",
              borderRadius: "5px",
              maxHeight: "400px",
              overflow: "auto",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{ marginBottom: "8px", fontFamily: "monospace" }}
              >
                {msg}
              </div>
            ))}
            {messages.length === 0 && <div>No messages yet</div>}
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <button
            style={{
              padding: "10px 15px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    </UserLayout>
  );
}
