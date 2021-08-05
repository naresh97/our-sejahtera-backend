import axios from "axios";
import { TelegramID } from "./types";

export async function setTelegramWebHook(): Promise<void> {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setWebhook`;
  await axios.post(url, {
    url: `${process.env.SERVER_API_URL}/${process.env.TELEGRAM_SECRET}`,
    allowed_updates: [],
    drop_pending_updates: true,
  });
}

export async function sendTelegramMessage(
  telegramID: TelegramID,
  message: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
  const response = await axios.post(url, {
    chat_id: telegramID,
    text: message,
  });
}

setTelegramWebHook();
