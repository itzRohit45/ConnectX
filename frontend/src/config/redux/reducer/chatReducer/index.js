import { createSlice } from "@reduxjs/toolkit";
import {
  getChatHistory,
  getUserConversations,
  markMessagesAsRead,
} from "../../action/chatAction";

const initialState = {
  isLoading: false,
  error: null,
  conversations: [],
  currentChat: {
    user: null,
    messages: [],
    isTyping: false,
  },
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentChatUser: (state, action) => {
      state.currentChat.user = action.payload;
    },
    addMessage: (state, action) => {
      // Add a new message to the current chat
      state.currentChat.messages.push(action.payload);

      // Update the conversation list with the new last message
      const conversationIndex = state.conversations.findIndex(
        (conv) =>
          conv.user._id === action.payload.sender._id ||
          conv.user._id === action.payload.receiver._id
      );

      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = action.payload;

        // If this is a received message, increase unread count
        if (
          action.payload.sender._id === state.currentChat.user?._id &&
          !action.payload.read
        ) {
          state.conversations[conversationIndex].unreadCount += 1;
        }
      }
    },
    setTypingStatus: (state, action) => {
      if (
        state.currentChat.user &&
        action.payload.sender === state.currentChat.user._id
      ) {
        state.currentChat.isTyping = action.payload.isTyping;
      }
    },
    clearCurrentChat: (state) => {
      state.currentChat = {
        user: null,
        messages: [],
        isTyping: false,
      };
    },
  },
  extraReducers: (builder) => {
    // Get conversations
    builder.addCase(getUserConversations.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getUserConversations.fulfilled, (state, action) => {
      state.isLoading = false;
      state.conversations = action.payload;
    });
    builder.addCase(getUserConversations.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload.message;
    });

    // Get chat history
    builder.addCase(getChatHistory.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getChatHistory.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentChat.messages = action.payload;

      // Update unread count for this conversation
      if (state.currentChat.user) {
        const conversationIndex = state.conversations.findIndex(
          (conv) => conv.user._id === state.currentChat.user._id
        );

        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].unreadCount = 0;
        }
      }
    });
    builder.addCase(getChatHistory.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload.message;
    });

    // Mark messages as read
    builder.addCase(markMessagesAsRead.fulfilled, (state, action) => {
      const { senderId } = action.payload;

      // Update conversation unread count
      const conversationIndex = state.conversations.findIndex(
        (conv) => conv.user._id === senderId
      );

      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].unreadCount = 0;
      }

      // Update read status in current chat messages
      if (state.currentChat.user && state.currentChat.user._id === senderId) {
        state.currentChat.messages = state.currentChat.messages.map((msg) => {
          if (msg.sender._id === senderId && !msg.read) {
            return { ...msg, read: true };
          }
          return msg;
        });
      }
    });
  },
});

export const {
  setCurrentChatUser,
  addMessage,
  setTypingStatus,
  clearCurrentChat,
} = chatSlice.actions;

export default chatSlice.reducer;
