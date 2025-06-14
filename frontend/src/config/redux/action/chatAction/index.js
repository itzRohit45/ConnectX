import { clientServer } from "@/config";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Get chat history between current user and another user
export const getChatHistory = createAsyncThunk(
  "chat/getChatHistory",
  async (params, thunkAPI) => {
    try {
      const response = await clientServer.get("/chat/history", {
        params: {
          token: params.token,
          receiverId: params.receiverId,
        },
      });
      return thunkAPI.fulfillWithValue(response.data);
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data || { message: "Failed to fetch chat history" }
      );
    }
  }
);

// Get all conversations for the current user
export const getUserConversations = createAsyncThunk(
  "chat/getUserConversations",
  async (params, thunkAPI) => {
    try {
      const response = await clientServer.get("/chat/conversations", {
        params: {
          token: params.token,
        },
      });
      return thunkAPI.fulfillWithValue(response.data);
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data || { message: "Failed to fetch conversations" }
      );
    }
  }
);

// Mark messages as read
export const markMessagesAsRead = createAsyncThunk(
  "chat/markMessagesAsRead",
  async (params, thunkAPI) => {
    try {
      const response = await clientServer.post("/chat/mark-read", {
        token: params.token,
        senderId: params.senderId,
      });
      return thunkAPI.fulfillWithValue({
        senderId: params.senderId,
        data: response.data,
      });
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data || { message: "Failed to mark messages as read" }
      );
    }
  }
);
