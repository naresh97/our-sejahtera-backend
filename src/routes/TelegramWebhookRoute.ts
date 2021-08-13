import { Request, Response } from "express";
import { getUserByTelegramID } from "../db/models/User.helper";
import { strings_en } from "../strings";
import { informContacts, sendTelegramMessage } from "../telegram";
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

export async function TelegramWebhookRoute(
  req: TelegramWebhookRequest,
  res: Response
) {
  try {
    if (req.body.message.connected_website) {
      await sendTelegramMessage(
        req.body.message.from.id,
        "Thanks for using OurSejahtera! Let's stay safer together <3"
      );
    } else {
      const messageText = req.body.message.text;
      const telegramID = req.body.message.from.id;
      if (messageText.toLowerCase() == "/covidpositive") {
        await userInfected(telegramID);
        await sendTelegramMessage(
          telegramID,
          strings_en.telegram_inform_positive
        );
        await informContacts(telegramID);
      }
    }
  } catch (e) {
    console.log(
      e instanceof Error ? e.message : "Could not get Telegram Message"
    );
  }

  res.send();
}

async function userInfected(telegramID: TelegramID): Promise<void> {
  const user = await getUserByTelegramID(telegramID);
  if (!user) throw new Error("User not found");
  user.isInfected = true;
  await user.save();
}
