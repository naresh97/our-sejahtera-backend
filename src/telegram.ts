import axios from "axios";
import { TelegramID } from "./db/db";

export function setTelegramWebHook(
  callback: (success: boolean) => void = () => {}
): void {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setWebhook`;
  axios
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

export function sendTelegramMessage(
  telegramID: TelegramID,
  message: string,
  callback: (success: boolean) => void = () => {}
): void {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
  axios
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

setTelegramWebHook();
