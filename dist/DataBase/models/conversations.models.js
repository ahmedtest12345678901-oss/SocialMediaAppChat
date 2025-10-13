"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationModel = void 0;
const mongoose_1 = require("mongoose");
const conversationSchema = new mongoose_1.Schema({
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
            type: mongoose_1.Types.ObjectId,
            ref: "User",
            required: true,
        },
    ],
}, {
    timestamps: true,
});
exports.conversationModel = (0, mongoose_1.model)("Conversation", conversationSchema);
