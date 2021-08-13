import axios from "axios";
import { Op } from "sequelize";
import { Contact } from "./db/models/Contact";
import { getUserByRowID, getUserByTelegramID } from "./db/models/User.helper";
import { strings_en } from "./strings";
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

export async function informContacts(telegramID: TelegramID): Promise<void> {
  const user = await getUserByTelegramID(telegramID);
  if (!user) throw new Error("User not found");
  const contacts = await Contact.findAll({
    where: {
      [Op.or]: [{ user: user.id }, { with: user.id }],
    },
  });

  contacts.forEach(async (contact) => {
    const otherPersonID = contact.user == user.id ? contact.with : contact.user;
    const otherUser = await getUserByRowID(otherPersonID);
    if (!otherUser) throw new Error("Other user does not exist");
    await sendTelegramMessage(
      otherUser.telegram,
      strings_en.telegram_inform_infect
    );
  });
}

setTelegramWebHook().catch((error) => {
  console.error("Error setting Telegram Webhook");
  error instanceof Error && console.error(error.message);
});
