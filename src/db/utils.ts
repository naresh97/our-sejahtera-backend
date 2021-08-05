import { strings_en } from "../strings";
import { sendTelegramMessage } from "../telegram";
import { TelegramID } from "../types";
import { Contact } from "./models/Contact";
import { User, UserInstance } from "./models/User";
import { getUserByTelegramID } from "./models/User.helper";

export async function addContact(
  userATelegram: TelegramID,
  userBTelegram: TelegramID
): Promise<void> {
  const userA = await getUserByTelegramID(userATelegram);
  const userB = await getUserByTelegramID(userBTelegram);

  if (!userA || !userB) {
    throw new Error("Could not found users");
  }

  await Contact.create({ user: userA.id, with: userB.id });
  await sendTelegramMessage(userB.telegram, strings_en.telegram_qr_scanned);
}

export async function createUser(
  telegram: TelegramID
): Promise<UserInstance | null> {
  const user = await User.create({
    telegram: telegram,
  });
  return user;
}
