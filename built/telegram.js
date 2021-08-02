"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegramMessage = exports.setTelegramWebHook = void 0;
const axios_1 = __importDefault(require("axios"));
function setTelegramWebHook(callback = () => { }) {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setWebhook`;
    axios_1.default
        .post(url, {
        url: `${process.env.SERVER_API_URL}/${process.env.TELEGRAM_SECRET}`,
        allowed_updates: [],
        drop_pending_updates: true,
    })
        .then((res) => {
        callback(!!res);
    })
        .catch((err) => {
        callback(!!err);
    });
}
exports.setTelegramWebHook = setTelegramWebHook;
function sendTelegramMessage(telegramID, message, callback = () => { }) {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
    axios_1.default
        .post(url, {
        chat_id: telegramID,
        text: message,
    })
        .then((res) => {
        callback(!!res);
    })
        .catch((err) => {
        console.error("Problem sending Telegram message.");
        callback(!!err);
    });
}
exports.sendTelegramMessage = sendTelegramMessage;
setTelegramWebHook();
