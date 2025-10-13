"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatInitiation = void 0;
const chat_event_1 = require("./chat.event");
const ChatInitiation = (socket) => {
    const chatEvents = new chat_event_1.ChatEvents(socket);
    chatEvents.sendPrivateMessageEvent();
    chatEvents.getConversationMessagesEvent();
    chatEvents.getGroupChatEvent();
    chatEvents.sendGroupMessageEvent();
    chatEvents.getGroupHistoryEvent();
    chatEvents.getGroupChatEvent();
    chatEvents.userConnectionEvents();
    chatEvents.typingEvents();
    chatEvents.sayHelloEvent();
};
exports.ChatInitiation = ChatInitiation;
