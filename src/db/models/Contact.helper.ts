import { Op } from "sequelize";
import { strings_en } from "../../strings";
import { sendTelegramMessage } from "../../telegram";
import { TelegramID } from "../../types";
import { Contact, ContactInterface } from "./Contact";
import { getUserByTelegramID } from "./User.helper";

export async function purgeOldContacts(telegramID: TelegramID): Promise<void> {
  const user = await getUserByTelegramID(telegramID);
  if (!user) throw new Error("User could not be found");
  const contacts = await Contact.findAll({
    where: {
      [Op.or]: [{ user: user.id }, { with: user.id }],
    },
  });
  let oldContacts: ContactInterface[] = [];
  const currentTime = new Date().getTime();
  contacts.forEach((contact) => {
    if (!contact.createdAt)
      throw new Error("Creation time not set for contact.");
    const contactAge = currentTime - contact.createdAt.getTime();
    if (contactAge > 60 * 60 * 24 * 14 * 10000) {
      oldContacts.push(contact);
    }
  });
  oldContacts.forEach(async (contact) => {
    await contact.destroy();
  });
}

export async function addContact(
  userATelegram: TelegramID,
  userBTelegram: TelegramID
): Promise<void> {
  const userA = await getUserByTelegramID(userATelegram);
  const userB = await getUserByTelegramID(userBTelegram);

  if (!userA || !userB) {
    throw new Error("Could not found users");
  }

  await purgeOldContacts(userATelegram);
  await purgeOldContacts(userBTelegram);

  await Contact.create({ user: userA.id, with: userB.id });
  await sendTelegramMessage(userB.telegram, strings_en.telegram_qr_scanned);
}
