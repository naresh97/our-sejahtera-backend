import { strings_en } from "../strings";
import { sendTelegramMessage } from "../telegram";
import { User, Contact, TelegramID, UserRowID } from "./db";

export function addContact(
  userATelegram: TelegramID,
  userBRowID: UserRowID,
  done: (success: boolean, message: string) => void
): void {
  User.findOne({ where: { telegram: userATelegram } }).then((userA) => {
    User.findOne({ where: { id: userBRowID } }).then((userB) => {
      if (!userA || !userB) {
        done(false, "Could not find user.");
        return;
      }

      Contact.create({ user: userA!.id, with: userBRowID })
        .then(() => {
          console.log(
            `Registering contact between ${userA!.id} and ${userBRowID}`
          );
          sendTelegramMessage(
            userB!.telegram,
            strings_en.telegram_qr_scanned,
          );
          done(true, "Successfully added contact");
        })
        .catch((e) => {
          done(false, e);
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
