import mongoose, { Document, Types } from "mongoose";

export interface IMessages extends Document {
  text?: string | null;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  attachments?: string[];
}

const messagesSchema = new mongoose.Schema<IMessages>(
  {
    text: { type: String, default: null },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const messagesModel = mongoose.model<IMessages>(
  "Messages",
  messagesSchema
);
