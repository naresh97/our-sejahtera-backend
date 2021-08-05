import { Request, Response } from "express";
import { Op } from "sequelize";
import { Contact } from "../db/models/Contact";
import { User } from "../db/models/User";
import { getUserByRowID, getUserByTelegramID } from "../db/models/User.helper";
import { strings_en } from "../strings";
import { sendTelegramMessage } from "../telegram";
import { TelegramID } from "../types";

interface TelegramWebhookRequest extends Request {
  body: {
    message: {
      text: string;
      from: {
        id: TelegramID;
      };
      connected_website: string;
    };
  };
}

export function TelegramWebhookRoute(
  req: TelegramWebhookRequest,
  res: Response
) {
  try {
    if (req.body.message.connected_website) {
      sendTelegramMessage(
        req.body.message.from.id,
        "Thanks for using OurSejahtera! Let's stay safer together <3"
      );
    } else {
      const messageText = req.body.message.text;
      const telegramID = req.body.message.from.id;
      if (messageText.toLowerCase() == "/covidpositive") {
        userInfected(telegramID, (success) => {
          if (success) {
            sendTelegramMessage(
              telegramID,
              strings_en.telegram_inform_positive
            );
            informContacts(telegramID);
          } else {
            sendTelegramMessage(telegramID, "Sorry, something went wrong.");
          }
        });
      }
    }
  } catch (e) {
    console.log("Could not get Telegram Message");
  }

  res.send();
}

function informContacts(telegramID: TelegramID) {
  getUserByTelegramID(telegramID, (user) => {
    if (user) {
      Contact.findAll({
        where: {
          [Op.or]: [{ user: user.id }, { with: user.id }],
        },
      }).then((result) => {
        result.forEach((contact) => {
          const otherPersonID =
            contact.user == user.id ? contact.with : contact.user;
          getUserByRowID(otherPersonID, (otherUser) => {
            otherUser &&
              sendTelegramMessage(
                otherUser.telegram,
                strings_en.telegram_inform_infect
              );
          });
        });
      });
    }
  });
}

function userInfected(
  telegramID: TelegramID,
  callback: (success: boolean) => void
): void {
  getUserByTelegramID(telegramID, (user) => {
    if (!!user) {
      user.isInfected = true;
      user
        .save()
        .then((result) => {
          callback(!!result);
        })
        .catch(() => {
          callback(false);
        });
    } else {
      callback(false);
    }
  });
}
