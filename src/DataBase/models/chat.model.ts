// import mongoose, { model, models, Schema, Types } from "mongoose";

// export interface IMessage {
//     content: string,
//     createdBy: Types.ObjectId,
//     createdAt?: Date,
//     updatedAt?: Date,
// }

// export interface IChat {
//     participants: Types.ObjectId[],
//     createdBy: Types.ObjectId,
//     messages: IMessage[]


//     group?: string,
//     groupImage?: string,
//     roomid?: string
//     createdAt?: Date,
//     updatedAt?: Date,

// }


// const messageSchema = new Schema<IMessage>({
//     content: { type: String, required: true },
//     createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
// }, { timestamps: true }); // timestamps => automatically adds createdAt & updatedAt

// const chatSchema = new Schema<IChat>({
//     participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
//     createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     messages: [messageSchema],
//     group: { type: String },
//     groupImage: { type: String },
//     roomid: { type: String, unique: true, sparse: true }, // roomid optional but unique if exists
// }, { timestamps: true });


// export const ChatModel = mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);
// export default ChatModel