// This is a quick debugging page to help isolate chat issues
// Place this in /pages/debug-chat.jsx

import React, { useEffect, useState } from "react";
import { BASE_URL } from "@/config";
import { io } from "socket.io-client";
import UserLayout from "@/layout/userLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import axios from "axios";
import {
  initializeSocket,
  checkSocketConnection,
  reconnectSocket,
} from "@/services/socketService";
import { useSelector } from "react-redux";

export default function DebugChat() {
  const [status, setStatus] = useState("Disconnected");
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [activeTest, setActiveTest] = useState("");
  const [socketStatus, setSocketStatus] = useState({});
  const [backendStatus, setBackendStatus] = useState("Unknown");

  const authState = useSelector((state) => state.auth);
  const chatState = useSelector((state) => state.chat);

  // Check if backend server is responsive
  const checkServerStatus = async () => {
    try {
      addMessage("Checking backend server status...");
      // Try a simple endpoint
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/users/check-server`, {
        method: "GET",
        headers: { Accept: "application/json" },
        mode: "cors",
        timeout: 5000,
      });
      const timeTaken = Date.now() - startTime;

      if (response.ok) {
        setBackendStatus(`Online (${timeTaken}ms)`);
        addMessage(`Server is online. Response time: ${timeTaken}ms`);
        return true;
      } else {
        setBackendStatus(`Error ${response.status}`);
        addMessage(
          `Server returned status ${response.status} ${response.statusText}`
        );
        return false;
      }
    } catch (error) {
      setBackendStatus("Offline/Unreachable");
      addMessage(`Server unreachable: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    // Get user info from localStorage
    const token = localStorage.getItem("token");
    setToken(token || "No token found");

    if (authState.user?.userId?._id) {
      setUserId(authState.user.userId._id);
    }

    // Check server status initially
    checkServerStatus();

    // Update socket status periodically
    const interval = setInterval(() => {
      setSocketStatus(checkSocketConnection());
    }, 3000);

    return () => clearInterval(interval);
  }, [authState.user]);

  const testDirectAPI = async () => {
    setActiveTest("api");
    try {
      addMessage("Testing direct API connection...");
      addMessage(
        `URL: ${BASE_URL}/chat/conversations?token=${token.substring(0, 10)}...`
      );

      // First try with fetch API
      let response;
      try {
        response = await fetch(
          `${BASE_URL}/chat/conversations?token=${token}`,
          {
            headers: { Accept: "application/json" },
            mode: "cors",
          }
        );

        addMessage(
          `Response status: ${response.status} ${response.statusText}`
        );

        // Try to get response text even if not JSON
        const text = await response.text();
        addMessage(
          `Raw response: ${text.substring(0, 200)}${
            text.length > 200 ? "..." : ""
          }`
        );

        // Try to parse as JSON if possible
        try {
          const data = JSON.parse(text);
          addMessage(
            `Parsed response: ${JSON.stringify(data).substring(0, 200)}...`
          );
        } catch (e) {
          addMessage(`Could not parse response as JSON: ${e.message}`);
        }
      } catch (fetchError) {
        addMessage(`Fetch error: ${fetchError.message}`);

        // Try with axios as backup
        addMessage("Trying with axios instead...");
        try {
          const axiosResponse = await axios.get(
            `${BASE_URL}/chat/conversations?token=${token}`
          );
          addMessage(`Axios status: ${axiosResponse.status}`);
          addMessage(
            `Axios data: ${JSON.stringify(axiosResponse.data).substring(
              0,
              200
            )}...`
          );
        } catch (axiosError) {
          addMessage(`Axios error: ${axiosError.message}`);
          if (axiosError.response) {
            addMessage(`Status: ${axiosError.response.status}`);
            addMessage(`Data: ${JSON.stringify(axiosError.response.data)}`);
          }
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        addMessage(
          `API connection successful: ${JSON.stringify(data, null, 2)}`
        );
      } else {
        addMessage(
          `API connection failed: ${response.status} ${response.statusText}`
        );
        const text = await response.text();
        addMessage(`Response: ${text}`);
      }
    } catch (error) {
      addMessage(`API error: ${error.message}`);
    }
    setActiveTest("");
  };

  const testAxiosAPI = async () => {
    setActiveTest("axios");
    try {
      addMessage("Testing API connection with Axios...");
      const response = await axios.get(`${BASE_URL}/chat/conversations`, {
        params: { token },
        timeout: 10000,
      });

      addMessage(
        `Axios API connection successful: ${JSON.stringify(
          response.data,
          null,
          2
        )}`
      );
    } catch (error) {
      addMessage(`Axios API error: ${error.message}`);
      if (error.response) {
        addMessage(`Status: ${error.response.status}`);
        addMessage(
          `Response data: ${JSON.stringify(error.response.data, null, 2)}`
        );
      }
    }
    setActiveTest("");
  };

  const testPingAPI = async () => {
    setActiveTest("ping");
    try {
      addMessage("Testing server connection with a simple ping...");

      // Try a simple endpoint that should work
      const response = await axios
        .get(`${BASE_URL}/ping`, {
          timeout: 5000,
        })
        .catch((e) => {
          // If ping endpoint doesn't exist, try another simple endpoint
          return axios.get(`${BASE_URL}`, { timeout: 5000 });
        });

      addMessage(`Server is reachable. Status: ${response.status}`);
    } catch (error) {
      addMessage(`Server connection error: ${error.message}`);
    }
    setActiveTest("");
  };

  const testSocketConnection = () => {
    setActiveTest("socket");
    try {
      addMessage("Testing direct socket connection...");
      const socket = io(BASE_URL, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        timeout: 10000,
        forceNew: true,
      });

      socket.on("connect", () => {
        setStatus(`Connected: ${socket.id}`);
        addMessage(`Socket connected: ${socket.id}`);

        // Try to join a room with user ID if available
        if (userId) {
          socket.emit("join", userId);
          addMessage(`Attempted to join room with userId: ${userId}`);
        }
      });

      socket.on("connect_error", (err) => {
        setStatus(`Error: ${err.message}`);
        addMessage(`Socket connect error: ${err.message}`);
      });

      socket.on("disconnect", (reason) => {
        setStatus(`Disconnected: ${reason}`);
        addMessage(`Socket disconnected: ${reason}`);
      });

      // Clean up after 10 seconds to avoid multiple connections
      setTimeout(() => {
        addMessage("Cleaning up test socket connection");
        socket.disconnect();
      }, 10000);
    } catch (error) {
      addMessage(`Socket setup error: ${error.message}`);
    }
    setActiveTest("");
  };

  const testReconnectSocket = () => {
    setActiveTest("reconnect");
    try {
      addMessage("Testing socket reconnection...");
      const success = reconnectSocket(userId);

      if (success) {
        addMessage("Socket reconnection initiated");
      } else {
        addMessage("Socket reconnection failed - socket not initialized");
      }

      // Update status after a short delay
      setTimeout(() => {
        const status = checkSocketConnection();
        setSocketStatus(status);
        addMessage(
          `Socket status after reconnect: ${
            status.connected ? "Connected" : "Disconnected"
          }`
        );
      }, 2000);
    } catch (error) {
      addMessage(`Socket reconnect error: ${error.message}`);
    }
    setActiveTest("");
  };

  const addMessage = (msg) => {
    setMessages((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  };

  const clearLog = () => {
    setMessages([]);
  };

  return (
    <UserLayout>
      <DashboardLayout>
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
          <h1>Chat Debugging</h1>

          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <h2>Environment</h2>
            <p>
              <strong>Base URL:</strong> {BASE_URL}
            </p>
            <p>
              <strong>User ID:</strong> {userId || "Not available"}
            </p>
            <p>
              <strong>Token:</strong>{" "}
              {token ? token.substring(0, 10) + "..." : "None"}
            </p>
          </div>

          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <h2>Socket Status</h2>
            <p>
              <strong>Connected:</strong>{" "}
              {socketStatus.connected ? "Yes" : "No"}
            </p>
            <p>
              <strong>Status:</strong> {socketStatus.status || status}
            </p>
            <p>
              <strong>ID:</strong> {socketStatus.id || "None"}
            </p>
          </div>

          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <h2>Redux State</h2>
            <p>
              <strong>Chat Loading:</strong> {chatState.loading ? "Yes" : "No"}
            </p>
            <p>
              <strong>Conversations:</strong>{" "}
              {(chatState.conversations || []).length}
            </p>
            <p>
              <strong>Error:</strong> {chatState.error || "None"}
            </p>
          </div>

          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <h2>Test Actions</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <button
                style={{
                  padding: "10px 15px",
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  opacity: activeTest ? 0.7 : 1,
                }}
                onClick={testDirectAPI}
                disabled={!!activeTest}
              >
                Test Fetch API
              </button>

              <button
                style={{
                  padding: "10px 15px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  opacity: activeTest ? 0.7 : 1,
                }}
                onClick={testAxiosAPI}
                disabled={!!activeTest}
              >
                Test Axios API
              </button>

              <button
                style={{
                  padding: "10px 15px",
                  background: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  opacity: activeTest ? 0.7 : 1,
                }}
                onClick={testPingAPI}
                disabled={!!activeTest}
              >
                Ping Server
              </button>

              <button
                style={{
                  padding: "10px 15px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  opacity: activeTest ? 0.7 : 1,
                }}
                onClick={testSocketConnection}
                disabled={!!activeTest}
              >
                Test Socket
              </button>

              <button
                style={{
                  padding: "10px 15px",
                  background: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  opacity: activeTest ? 0.7 : 1,
                }}
                onClick={testReconnectSocket}
                disabled={!!activeTest}
              >
                Reconnect Socket
              </button>

              <button
                style={{
                  padding: "10px 15px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
                onClick={clearLog}
              >
                Clear Log
              </button>
            </div>

            {activeTest && (
              <p style={{ marginTop: "10px" }}>
                <em>Test in progress... please wait</em>
              </p>
            )}
          </div>

          <div>
            <h2>Debug Log</h2>
            <div
              style={{
                background: "#2d3748",
                color: "#e2e8f0",
                padding: "15px",
                borderRadius: "5px",
                maxHeight: "400px",
                overflow: "auto",
                fontFamily: "monospace",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  {msg}
                </div>
              ))}
              {messages.length === 0 && (
                <div>No messages yet. Run a test to see results.</div>
              )}
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
              Refresh Page
            </button>
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}
