import ChatMessage from "../models/chatModel.js";
import User from "../models/usersModel.js";
import ConnectionRequest from "../models/connectionsModel.js";

// Get chat history between two users
export const getChatHistory = async (req, res) => {
  try {
    const { token, receiverId } = req.query;

    // Find the user by token
    const sender = await User.findOne({ token });
    if (!sender) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if users are connected
    const isConnected = await ConnectionRequest.findOne({
      $or: [
        { userId: sender._id, connectionId: receiverId, status: "accepted" },
        { userId: receiverId, connectionId: sender._id, status: "accepted" },
      ],
    });

    if (!isConnected) {
      return res
        .status(403)
        .json({ message: "You are not connected with this user" });
    }

    // Get chat history
    const messages = await ChatMessage.find({
      $or: [
        { sender: sender._id, receiver: receiverId },
        { sender: receiverId, receiver: sender._id },
      ],
    })
      .sort({ createdAt: 1 }) // Order by timestamp
      .populate("sender", "name username profilePicture")
      .populate("receiver", "name username profilePicture");

    // Mark messages as read
    await ChatMessage.updateMany(
      { sender: receiverId, receiver: sender._id, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getChatHistory:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all conversations for a user
export const getUserConversations = async (req, res) => {
  try {
    const { token } = req.query;

    console.log(
      "GET /chat/conversations - Token received:",
      token ? token.substring(0, 10) + "..." : "No token"
    );

    // Input validation
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    if (typeof token !== "string" || token.length < 10) {
      return res.status(400).json({ message: "Invalid token format" });
    }

    // Find the user by token
    const user = await User.findOne({ token });
    if (!user) {
      console.log("GET /chat/conversations - User not found with token");
      return res
        .status(401)
        .json({ message: "Unauthorized - User not found with provided token" });
    }

    console.log(
      `GET /chat/conversations - Found user: ${user.username} (${user._id})`
    );

    // Get all accepted connections
    const connections = await ConnectionRequest.find({
      $or: [
        { userId: user._id, status: "accepted" },
        { connectionId: user._id, status: "accepted" },
      ],
    }).populate("userId connectionId", "name username profilePicture");

    console.log(
      `GET /chat/conversations - Found ${connections.length} connections`
    );

    // Format the connections data with the last message
    const conversations = await Promise.all(
      connections.map(async (conn) => {
        try {
          // Determine the other user in the conversation
          const otherUser =
            conn.userId &&
            conn.userId._id &&
            conn.userId._id.toString() === user._id.toString()
              ? conn.connectionId
              : conn.userId;

          if (!otherUser || !otherUser._id) {
            console.log(
              "GET /chat/conversations - Missing user reference in connection:",
              conn._id
            );
            return null;
          }

          // Get the last message
          const lastMessage = await ChatMessage.findOne({
            $or: [
              { sender: user._id, receiver: otherUser._id },
              { sender: otherUser._id, receiver: user._id },
            ],
          })
            .sort({ createdAt: -1 })
            .limit(1);

          // Count unread messages
          const unreadCount = await ChatMessage.countDocuments({
            sender: otherUser._id,
            receiver: user._id,
            read: false,
          });

          return {
            user: otherUser,
            lastMessage: lastMessage || null,
            unreadCount: unreadCount,
          };
        } catch (err) {
          console.error("Error processing connection:", err, conn._id);
          return null; // Skip this conversation on error
        }
      })
    );

    // Filter out any null values from errors
    const validConversations = conversations.filter((convo) => convo !== null);

    console.log(
      `GET /chat/conversations - Returning ${validConversations.length} valid conversations`
    );
    return res.status(200).json(validConversations);
  } catch (error) {
    console.error("Error in getUserConversations:", error);
    return res.status(500).json({
      message: "Server error",
      details: error.message,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { token, senderId } = req.body;

    // Find the user by token (receiver)
    const receiver = await User.findOne({ token });
    if (!receiver) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Update all unread messages from sender to receiver
    const result = await ChatMessage.updateMany(
      { sender: senderId, receiver: receiver._id, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      message: "Messages marked as read",
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
