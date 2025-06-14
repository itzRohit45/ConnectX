import { clientServer } from "@/config";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Get chat history between current user and another user
export const getChatHistory = createAsyncThunk(
  "chat/getChatHistory",
  async (params, thunkAPI) => {
    try {
      console.log(
        `Fetching chat history with receiverId: ${params.receiverId}`
      );

      const response = await clientServer.get("/chat/history", {
        params: {
          token: params.token,
          receiverId: params.receiverId,
        },
        timeout: 10000, // 10 second timeout
      });

      console.log(
        `Chat history fetched successfully: ${response.data.length} messages`
      );
      return thunkAPI.fulfillWithValue(response.data);
    } catch (err) {
      console.error("Error fetching chat history:", err);

      // Enhanced error reporting
      const errorMsg =
        err.response?.data?.message ||
        (err.response ? `Server error ${err.response.status}` : err.message) ||
        "Failed to fetch chat history";

      return thunkAPI.rejectWithValue({
        message: errorMsg,
        status: err.response?.status,
        data: err.response?.data,
      });
    }
  }
);

// Get all conversations for the current user
export const getUserConversations = createAsyncThunk(
  "chat/getUserConversations",
  async (params, thunkAPI) => {
    try {
      // First, validate the token
      if (
        !params.token ||
        typeof params.token !== "string" ||
        params.token.length < 10
      ) {
        throw new Error("Invalid token format");
      }

      console.log("Token being sent:", params.token);

      const response = await clientServer.get("/chat/conversations", {
        params: {
          token: params.token,
        },
        timeout: 15000, // 15 second timeout
      });

      console.log(
        `Conversations fetched successfully: ${response.data.length} conversations`
      );
      return thunkAPI.fulfillWithValue(response.data);
    } catch (err) {
      console.error("Error fetching conversations:", err);

      // Enhanced error reporting
      const errorMsg =
        err.response?.data?.message ||
        (err.response ? `Server error ${err.response.status}` : err.message) ||
        "Failed to fetch conversations";

      return thunkAPI.rejectWithValue({
        message: errorMsg,
        status: err.response?.status,
        data: err.response?.data,
      });
    }
  }
);

// Mark messages as read
export const markMessagesAsRead = createAsyncThunk(
  "chat/markMessagesAsRead",
  async (params, thunkAPI) => {
    try {
      console.log(`Marking messages as read from senderId: ${params.senderId}`);

      const response = await clientServer.post("/chat/mark-read", {
        token: params.token,
        senderId: params.senderId,
      });

      console.log(`Messages marked as read: ${response.data.count} messages`);
      return thunkAPI.fulfillWithValue({
        senderId: params.senderId,
        count: response.data.count,
      });
    } catch (err) {
      console.error("Error marking messages as read:", err);

      // Enhanced error reporting
      const errorMsg =
        err.response?.data?.message ||
        (err.response ? `Server error ${err.response.status}` : err.message) ||
        "Failed to mark messages as read";

      return thunkAPI.rejectWithValue({
        message: errorMsg,
        status: err.response?.status,
        data: err.response?.data,
      });
    }
  }
);
