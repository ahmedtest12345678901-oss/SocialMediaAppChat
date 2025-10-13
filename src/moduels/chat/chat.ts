import { Socket } from "socket.io";
import { ChatEvents } from "./chat.event";






export const ChatInitiation = (socket: Socket) => {
    const chatEvents = new ChatEvents(socket)
    chatEvents.sendPrivateMessageEvent()
    chatEvents.getConversationMessagesEvent()
    chatEvents.getGroupChatEvent();
    chatEvents.sendGroupMessageEvent();
    chatEvents.getGroupHistoryEvent();
    chatEvents.getGroupChatEvent();
    chatEvents.userConnectionEvents();
    chatEvents.typingEvents();
    chatEvents.sayHelloEvent()
}