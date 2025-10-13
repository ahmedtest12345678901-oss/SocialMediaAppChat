const baseURL = 'http://localhost:3000';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

const headers = {
    Authorization: `Bearer ${token}`,
};

let globalProfile = JSON.parse(localStorage.getItem('profile')) || {};
const socket = io(baseURL, {
    auth: { authorization: token }
});

// =================== Caching ===================
const conversationsCache = {};
const groupCache = {};

// =================== Online / Offline ===================
socket.on("user-online", ({ userId }) => {
    $(`#c_${userId}`).text("🟢");
});

socket.on("user-offline", ({ userId }) => {
    $(`#c_${userId}`).text("🔴");
});

// =================== Typing Indicator ===================
let typingTimeout;
function startTyping(toUserId) {
    socket.emit("typing", toUserId);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => stopTyping(toUserId), 2000);
}

function stopTyping(toUserId) {
    socket.emit("stop-typing", toUserId);
}

$("#messageBody").on("input", function () {
    const toUserId = $("#sendMessage").attr("onclick")?.match(/'([^']+)'/)?.[1];
    if (toUserId) startTyping(toUserId);
});

socket.on("typing", ({ from }) => {
    if (!$(`#typing_${from}`).length) {
        $("#messageList").append(`<div id="typing_${from}" class="text-muted ps-2">User is typing...</div>`);
    }
});

socket.on("stop-typing", ({ from }) => {
    $(`#typing_${from}`).remove();
});

// =================== Connection ===================
socket.on("connect_user", (data) => {
    console.log("✅ Connected user:", data);
    globalProfile = data.user || data;
    localStorage.setItem("profile", JSON.stringify(globalProfile));
});

socket.emit("say-hello", "Hello from Front-End to Back-End 😒")

socket.on("disconnect_user", (data) => {
    console.log("❌ Disconnected user:", data);
});

socket.on("server_error", (err) => {
    console.error("⚠️ Server error:", err.message);
});

// =================== Images ===================
let avatar = './avatar/Avatar-No-Background.png';
let meImage = './avatar/Avatar-No-Background.png';
let friendImage = './avatar/Avatar-No-Background.png';

// =================== Send Message ===================
function sendMessage(sendTo, type) {
    const messageText = $("#messageBody").val();
    if (!messageText) return;

    if (type == "ovo") {
        const data = { text: messageText, targetUserId: sendTo };
        socket.emit('send-private-message', data);
    } else if (type == "ovm") {
        const data = { text: messageText, targetGroupId: sendTo };
        socket.emit('send-group-message', data);
    }
}

socket.on('message-sent', (data) => {
    const { text, senderId, conversationId } = data;

    if (conversationId) {
        conversationsCache[conversationId] = conversationsCache[conversationId] || [];
        conversationsCache[conversationId].push(data);
    }

    const div = document.createElement('div');
    div.className = 'me text-end p-2';
    div.dir = senderId.toString() === globalProfile._id ? 'rtl' : 'ltr';
    div.innerHTML = `<img class="chatImage" src="${avatar}" alt=""><span class="mx-2">${text}</span>`;
    document.getElementById('messageList').appendChild(div);
    $(".noResult").hide();
    $("#messageBody").val('');


    ///هو ده ملف audio 

    // const audio = document.getElementById("notifyTone");
    // if (audio) {
    //     audio.currentTime = 0;
    //     audio.play().catch(err => console.log("Audio play blocked:", err));
    // }
});

function renderMyMessage(text, imagePath) {
    const div = document.createElement('div');
    div.className = 'me text-end p-2';
    div.dir = 'rtl';
    div.innerHTML = `<img class="chatImage" src="${imagePath}" alt=""><span class="mx-2">${text}</span>`;
    document.getElementById('messageList').appendChild(div);
}

function renderFriendMessage(text, imagePath) {
    const div = document.createElement('div');
    div.className = 'myFriend p-2';
    div.dir = 'ltr';
    div.innerHTML = `<img class="chatImage" src="${imagePath}" alt=""><span class="mx-2">${text}</span>`;
    document.getElementById('messageList').appendChild(div);
}

function SayHi() {
    const div = document.createElement('div');
    div.className = 'noResult text-center  p-2';
    div.dir = 'ltr';
    div.innerHTML = `<span class="mx-2">Say Hi to start the conversation.</span>`;
    document.getElementById('messageList').appendChild(div);
}

async function getUserData() {
    try {
        const response = await axios.get(`${baseURL}/users/getProfile`, { headers });
        const user = response.data?.data?.user;
        if (!user) return;

        document.getElementById("profileImage").src = avatar;
        document.getElementById("userName").innerHTML = `${user.userName}`;

        showUsersData(user.friends || []);
    } catch (err) {
        console.error(" Error getting user data:", err);
    }
}

function showUsersData(friends = []) {
    let cartonna = ``;
    for (const friend of friends) {
        cartonna += `
            <div onclick="displayChatUser('${friend._id}')" class="chatUser my-2">
                <img class="chatImage" src="${avatar}" alt="">
                <span class="ps-2">${friend.userName} ${friend.lName}</span>
                <span id="c_${friend._id}" class="ps-2 closeSpan">🟢</span>
            </div>`;
    }
    document.getElementById('chatUsers').innerHTML = cartonna;
}

function showData(sendTo, chat) {
    document.getElementById("sendMessage").setAttribute("onclick", `sendMessage('${sendTo}' , "ovo")`);
    document.getElementById('messageList').innerHTML = ''
    if (chat?.length) {
        $(".noResult").hide()
        for (const message of chat) {

            if (message.senderId.toString() == globalProfile._id.toString()) {
                renderMyMessage(message.text, meImage)
            } else {
                renderFriendMessage(message.text, friendImage)
            }
        }
    } else {
        SayHi()
    }
    $(`#c_${sendTo}`).hide();
}


function displayChatUser(userId) {
    if (conversationsCache[userId]?.length) {
        showData(userId, conversationsCache[userId]);
    }

    socket.emit('get-chat-history', userId);

    socket.off('chat-history');

    socket.once('chat-history', (chat) => {
        if (chat?.length) {
            const existing = new Set(conversationsCache[userId]?.map(m => m._id));
            const merged = [
                ...(conversationsCache[userId] || []),
                ...chat.filter(m => !existing.has(m._id))
            ];
            conversationsCache[userId] = merged;
            showData(userId, merged);
        } else {
            showData(userId, conversationsCache[userId] || []);
        }
    });
}


function showGroupList(groups = []) {
    let cartonna = ``;
    for (const group of groups) {
        let imagePath = group.image || "/images/defaultGroup.png";
        cartonna += `
            <div onclick="displayGroupChat('${group._id}')" class="chatUser my-2">
                <img class="chatImage" src="${imagePath}" alt="">
                <span class="ps-2">${group.name}</span>
            </div>`;
    }
    document.getElementById('chatGroups').innerHTML = cartonna;
}

function showGroupData(sendTo, chat) {
    document.getElementById("sendMessage").setAttribute("onclick", `sendMessage('${sendTo}' , "ovm")`);
    groupCache[sendTo] = chat;
    const messages = groupCache[sendTo];

    const messageList = document.getElementById('messageList');
    messageList.innerHTML = '';
    if (messages?.length) {
        $(".noResult").hide();
        for (const message of messages) {
            if (message.senderId?.toString() === globalProfile._id.toString()) {
                renderMyMessage(message.text, meImage);
            } else {
                renderFriendMessage(message.text, friendImage);
            }
        }
    } else {
        SayHi();
    }
    $(`#g_${sendTo}`).hide();
}

function displayGroupChat(groupId) {
    socket.emit("get-group-chat", groupId);
    socket.off("group-chat-history");
    socket.once("group-chat-history", (chat) => {
        showGroupData(groupId, chat?.length ? chat : []);
    });
}

async function fetchMyGroups() {
    try {
        const response = await axios.get(`${baseURL}/users/my-groups`, { headers });
        const groups = response.data?.groups || [];
        showGroupList(groups);
    } catch (err) {
        console.error("❌ Error fetching groups:", err);
    }
}

getUserData();
fetchMyGroups();
