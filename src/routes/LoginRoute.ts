import { Request, Response } from "express";
import { TelegramID, User, UserRowID } from "../db/db";
import crypto from "crypto";
import { addContact, createUser } from "../db/utils";

declare module "express-session" {
  interface Session {
    verified: boolean;
    verifiedBy: UserRowID;
  }
}

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
  authUser(telegramResponse, (authObject) => {
    if (authObject) {
      // User is already logged in
      if (req.session.user == telegramResponse.id) {
        res.send(authObject);
        return;
      }
      const verified = req.session.verified;
      const verifiedBy = req.session.verifiedBy;
      req.session.regenerate(() => {
        req.session.user = telegramResponse.id;
        if (verified) {
          addContact(telegramResponse.id, verifiedBy, (contactSuccess) => {
            res.send({
              authorized: authObject.authorized,
              contactSuccess: contactSuccess,
            });
          });
        } else {
          res.send(authObject);
        }
      });
    } else {
      res.status(401).send(authObject);
    }
  });
}

function authUser(
  telegramResponse: TelegramLoginResponse,
  callback: (callbackObject: { authorized: boolean }) => void
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
    callback({ authorized: false });
  }

  User.findOne({
    where: {
      telegram: telegramResponse.id,
    },
  }).then((user) => {
    if (!user) {
      createUser(telegramResponse.id, (success) => {
        callback({ authorized: success });
      });
    } else {
      callback({ authorized: true });
    }
  });
}

exports.LoginRoute = LoginRoute;
