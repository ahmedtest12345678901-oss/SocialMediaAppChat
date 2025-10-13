import { Socket } from "socket.io";
import { SocketWithUser } from "../geteway/gateway.interface";
import { MessagesRepository } from "../../repositories/messages.repository";
import { ConversationRepository } from "../../repositories/conversation.repositories";
import { getIo } from "../geteway/geteway";
import { conversationModel } from "../../DataBase/models/conversations.models";
import { messagesModel } from "../../DataBase/models/messages.model";
import { AppError } from "../../utils/classError";

export class ChatService {


   private conversationRepository: ConversationRepository = new ConversationRepository(conversationModel)
   private messagesRepository: MessagesRepository = new MessagesRepository(messagesModel)

   async joinPrivateChat(socket: Socket, targetUserId: string) {
      let conversation = await this.conversationRepository.findOnDocument({
         type: 'direct',
         members: { $all: [socket.data.userId, targetUserId] }
      })
      if (!conversation) {
         conversation = await this.conversationRepository.createNewDocument({
            type: 'direct',
            members: [socket.data.userId, targetUserId]
         })
      }
      socket.join(conversation._id.toString())
      return conversation
   }



   async sendPrivateMessage(socket: Socket, data: { text: string; targetUserId: string }) {
      const { text, targetUserId } = data;

      const conversation = await this.joinPrivateChat(socket, targetUserId);
      if (!conversation) throw new Error("Conversation not found");

      const message = await this.messagesRepository.createNewDocument({
         text,
         conversationId: conversation._id,
         senderId: socket.data.userId,
      });

      getIo()?.to(conversation._id.toString()).emit("message-sent", message);
   }


   async getConversationMessages(socket: Socket, targetUserId: string) {
      const conversation = await this.joinPrivateChat(socket, targetUserId);

      const messages = await this.messagesRepository.findDoucuments({
         filter: { conversationId: conversation._id }
      });

      socket.emit('chat-history', messages);
   }


   async getGroupChatMessages(groupId: string) {
      const group = await conversationModel.findOne({ _id: groupId, type: "group" })
         .populate("members", "name avatar")
         .lean();

      if (!group) throw new Error("Group not found");

      const messages = await messagesModel.find({ conversationId: groupId })
         .populate("senderId", "name avatar")
         .sort({ createdAt: 1 })
         .lean();

      return messages;
   }









   async joinChatGroup(socket: Socket, targetGroupId: string) {
      const conversation = await this.conversationRepository.findOnDocument({
         _id: targetGroupId,
         type: 'group'
      });

      if (!conversation) {
         throw new AppError('Group not found', 404);
      }

      socket.join(conversation._id.toString());
      return conversation;
   }




   async sendGroupMessage(socket: Socket, data: unknown) {
      const { text, targetGroupId } = data as { text: string, targetGroupId: string }
      const conversation = await this.joinChatGroup(socket, targetGroupId)
      const message = await this.messagesRepository.createNewDocument({
         text,
         conversationId: conversation._id,
         senderId: socket.data.userId
      })

      getIo()?.to(conversation._id.toString()).emit('message-sent', message)
   }





   async getGroupHistory(socket: Socket, targetGroupId: string) {
      const message = await this.messagesRepository.findDoucuments({
         filter: { conversationId: targetGroupId }
      });


      socket.emit('group-chat-history', message)
   }


























   sayHello(data: unknown) {
      console.log(data);

   }





















}



