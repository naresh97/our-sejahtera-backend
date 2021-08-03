import { strings_en } from "../strings";
import { sendTelegramMessage } from "../telegram";
import { TelegramID, UserRowID } from "../types";
import { Contact } from "./models/Contact";
import { User } from "./models/User";
import { getUserByRowID, getUserByTelegramID } from "./models/User.helper";

export function addContact(
  userATelegram: TelegramID,
  userBTelegram: TelegramID,
  callback: (success: boolean, message?: string) => void
): void {
  getUserByTelegramID(userATelegram, (userA) => {
    getUserByTelegramID(userBTelegram, (userB) => {
      if (!userA || !userB) {
        callback(false, "Could not find user.");
        return;
      }

      Contact.create({ user: userA.id, with: userB.id })
        .then(() => {
          console.log(
            `Registering contact between ${userA.id} and ${userB.id}`
          );
          sendTelegramMessage(userB.telegram, strings_en.telegram_qr_scanned);
          callback(true, "Successfully added contact");
        })
        .catch((e) => {
          callback(false, e);
        });
    });
  });
}

export function createUser(
  telegram: TelegramID,
  callback: (success: boolean, message: string) => void
): void {
  User.create({
    telegram: telegram,
  })
    .then((user) => {
      if (!user) {
        callback(false, "Could not create user");
      } else {
        callback(true, "Success");
      }
    })
    .catch((reason) => {
      if (reason.name == "SequelizeUniqueConstraintError") {
        callback(false, "User already exists");
      } else {
        callback(false, "Unknown error");
      }
    });
}
