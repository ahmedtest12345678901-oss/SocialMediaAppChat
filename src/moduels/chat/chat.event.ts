import { Socket } from "socket.io";
import { ChatService } from "./chat.services";

export class ChatEvents {
    private chatService: ChatService = new ChatService()

    constructor(private socket: Socket) { }




    sendPrivateMessageEvent() {
        this.socket.on('send-private-message', (data) => {
            this.chatService.sendPrivateMessage(this.socket, data)
        })
    }


    getConversationMessagesEvent() {
        this.socket.on('get-chat-history', (data) => {
            this.chatService.getConversationMessages(this.socket, data)

        })
    }

    getGroupChatEvent() {
        this.socket.on('get-group-chat', async (groupId: string) => {
            try {
                const chat = await this.chatService.getGroupChatMessages(groupId);
                this.socket.emit('group-chat-history', chat);
            } catch (error: any) {
                console.error("Error fetching group chat:", error.message);
                this.socket.emit('group-chat-history', []); 
            }
        });
    }
    

    sendGroupMessageEvent() {
        this.socket.on("send-group-message", (data) => {
            this.chatService.sendGroupMessage(this.socket, data)
        })
    }

    getGroupHistoryEvent() {
        this.socket.on('get-group-chat', (data) => {
            this.chatService.getGroupHistory(this.socket, data)
        })
    }






    userConnectionEvents() {
        const userId = this.socket.data.userId;

        this.socket.broadcast.emit("user-online", { userId });

        this.socket.on("disconnect", () => {
            this.socket.broadcast.emit("user-offline", { userId });
        });
    }


    typingEvents() {
        this.socket.on("typing", (targetUserId: string) => {
            this.socket.to(targetUserId).emit("typing", { from: this.socket.data.userId });
        });

        this.socket.on("stop-typing", (targetUserId: string) => {
            this.socket.to(targetUserId).emit("stop-typing", { from: this.socket.data.userId });
        });
    }





    sayHelloEvent() {
        this.socket.on('say-hello', (data) => {
            this.chatService.sayHello(data)
        })
    }



}