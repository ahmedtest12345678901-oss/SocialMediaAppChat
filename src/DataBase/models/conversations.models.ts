import { Schema, model, Types, Document, Model } from "mongoose";

export type ConversationType = "direct" | "group";

// ✅ الواجهة الأساسية
export interface IConversation {
  _id: Types.ObjectId;
  type: ConversationType;
  name?: string;
  members: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ نجعلها تمتد من Document ليكون النموذج متوافقًا
export type ConversationDocument = IConversation & Document;

// ✅ تعريف الـ Schema مع النوع الجنيريكي
const conversationSchema = new Schema<ConversationDocument>(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
  },
  {
    timestamps: true, // يضيف createdAt و updatedAt
  }
);

// ✅ إنشاء الموديل بنوع مضبوط تمامًا
export const conversationModel: Model<ConversationDocument> = model<ConversationDocument>(
  "Conversation",
  conversationSchema
);
