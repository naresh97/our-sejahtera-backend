import { Request, Response } from "express";
import { Op } from "sequelize";
import { Contact } from "../db/models/Contact";
import { User } from "../db/models/User";
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
        userInfected(telegramID, (result) => {
          if (result.saved) {
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
  User.findOne({
    where: {
      telegram: telegramID,
    },
  }).then((user) => {
    if (user) {
      const userRowID = user.id;
      Contact.findAll({
        where: {
          [Op.or]: [{ user: userRowID }, { with: userRowID }],
        },
      }).then((result) => {
        result.forEach((contact) => {
          const otherPersonID =
            contact.user == userRowID ? contact.with : contact.user;
          User.findOne({
            where: {
              id: otherPersonID,
            },
          }).then((otherPerson) => {
            otherPerson &&
              sendTelegramMessage(
                otherPerson.telegram,
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
  callback: (callbackObject: { saved: boolean }) => void
): void {
  User.findOne({
    where: {
      telegram: telegramID,
    },
  })
    .then((user) => {
      if (!user) {
        callback({ saved: false });
      } else {
        user.isInfected = true;
        user
          .save()
          .then((result) => {
            if (result) {
              callback({ saved: true });
            }
          })
          .catch((err) => {
            callback({ saved: false });
          });
      }
    })
    .catch((err) => {
      callback({ saved: false });
    });
}
