import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Create indexes for faster querying
ChatMessageSchema.index({ sender: 1, receiver: 1 });
ChatMessageSchema.index({ createdAt: -1 });

const ChatMessage = mongoose.model("ChatMessage", ChatMessageSchema);

export default ChatMessage;
