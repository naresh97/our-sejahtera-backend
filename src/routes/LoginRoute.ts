import { Request, Response } from "express";
import crypto from "crypto";
import { addContact, createUser } from "../db/utils";
import { TelegramID, UserRowID } from "../types";
import { User } from "../db/models/User";
import { getUserByTelegramID } from "../db/models/User.helper";

type TelegramLoginResponse = {
  id: TelegramID;
  hash: string;
};

interface LoginRequest extends Request {
  body: {
    telegramResponse: TelegramLoginResponse;
  };
}

export function LoginRoute(req: LoginRequest, res: Response) {
  const telegramResponse = req.body.telegramResponse;
  authUser(telegramResponse, (authorized) => {
    if (authorized) {
      // User is already logged in
      if (req.session.userTelegramID == telegramResponse.id) {
        res.send({authorized: authorized});
        return;
      }
      const verified = req.session.isVerified;
      const verifiedBy = req.session.verifiedByTelegramID;
      req.session.regenerate(() => {
        req.session.userTelegramID = telegramResponse.id;
        if (verified) {
          addContact(telegramResponse.id, verifiedBy, (success) => {
            res.send({
              authorized: authorized,
              contactSuccess: success,
            });
          });
        } else {
          res.send({authorized: authorized});
        }
      });
    } else {
      res.status(401).send(authorized);
    }
  });
}

function authUser(
  telegramResponse: TelegramLoginResponse,
  callback: (authorized: boolean, message?: string) => void
): void {
  let dataCheckArray = [];

  for (const [key, value] of Object.entries(telegramResponse)) {
    if (key == "hash") continue;
    dataCheckArray.push(`${key}=${value}`);
  }
  dataCheckArray.sort();
  const dataCheckString = dataCheckArray.join("\n");

  const secretKey = crypto
    .createHash("sha256")
    .update(process.env.TELEGRAM_TOKEN!)
    .digest();
  const confirmationHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const authorized = confirmationHash == telegramResponse.hash;

  if (!authorized) {
    callback(false);
    return;
  }

  getUserByTelegramID(telegramResponse.id, (user) => {
    if (!!user) {
      callback(true);
    } else {
      createUser(telegramResponse.id, (success, message) => {
        callback(success, message);
      });
    }
  });
}
