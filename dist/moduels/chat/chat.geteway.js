"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const chat_event_1 = require("./chat.event");
class ChatGateway {
    ChatEvent = new chat_event_1.ChatEvent();
    constructor() { }
    register = (socket) => {
        this.ChatEvent.sayHi(socket);
    };
}
exports.ChatGateway = ChatGateway;
