"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const messages_repository_1 = require("../../repositories/messages.repository");
const conversation_repositories_1 = require("../../repositories/conversation.repositories");
const geteway_1 = require("../geteway/geteway");
const conversations_models_1 = require("../../DataBase/models/conversations.models");
const messages_model_1 = require("../../DataBase/models/messages.model");
const classError_1 = require("../../utils/classError");
class ChatService {
    conversationRepository = new conversation_repositories_1.ConversationRepository(conversations_models_1.conversationModel);
    messagesRepository = new messages_repository_1.MessagesRepository(messages_model_1.messagesModel);
    async joinPrivateChat(socket, targetUserId) {
        let conversation = await this.conversationRepository.findOnDocument({
            type: 'direct',
            members: { $all: [socket.data.userId, targetUserId] }
        });
        if (!conversation) {
            conversation = await this.conversationRepository.createNewDocument({
                type: 'direct',
                members: [socket.data.userId, targetUserId]
            });
        }
        socket.join(conversation._id.toString());
        return conversation;
    }
    async sendPrivateMessage(socket, data) {
        const { text, targetUserId } = data;
        const conversation = await this.joinPrivateChat(socket, targetUserId);
        if (!conversation)
            throw new Error("Conversation not found");
        const message = await this.messagesRepository.createNewDocument({
            text,
            conversationId: conversation._id,
            senderId: socket.data.userId,
        });
        (0, geteway_1.getIo)()?.to(conversation._id.toString()).emit("message-sent", message);
    }
    async getConversationMessages(socket, targetUserId) {
        const conversation = await this.joinPrivateChat(socket, targetUserId);
        const messages = await this.messagesRepository.findDoucuments({
            filter: { conversationId: conversation._id }
        });
        socket.emit('chat-history', messages);
    }
    async getGroupChatMessages(groupId) {
        const group = await conversations_models_1.conversationModel.findOne({ _id: groupId, type: "group" })
            .populate("members", "name avatar")
            .lean();
        if (!group)
            throw new Error("Group not found");
        const messages = await messages_model_1.messagesModel.find({ conversationId: groupId })
            .populate("senderId", "name avatar")
            .sort({ createdAt: 1 })
            .lean();
        return messages;
    }
    async joinChatGroup(socket, targetGroupId) {
        const conversation = await this.conversationRepository.findOnDocument({
            _id: targetGroupId,
            type: 'group'
        });
        if (!conversation) {
            throw new classError_1.AppError('Group not found', 404);
        }
        socket.join(conversation._id.toString());
        return conversation;
    }
    async sendGroupMessage(socket, data) {
        const { text, targetGroupId } = data;
        const conversation = await this.joinChatGroup(socket, targetGroupId);
        const message = await this.messagesRepository.createNewDocument({
            text,
            conversationId: conversation._id,
            senderId: socket.data.userId
        });
        (0, geteway_1.getIo)()?.to(conversation._id.toString()).emit('message-sent', message);
    }
    async getGroupHistory(socket, targetGroupId) {
        const message = await this.messagesRepository.findDoucuments({
            filter: { conversationId: targetGroupId }
        });
        socket.emit('group-chat-history', message);
    }
    sayHello(data) {
        console.log(data);
    }
}
exports.ChatService = ChatService;
