import { Request, Response } from "express";
import { TelegramID, User, UserInstance } from "../db/db";
import bcrypt from "bcrypt";
import QRCode, { QRCodeToDataURLOptions } from "qrcode";

declare module "express-session" {
  interface Session {
    user: TelegramID;
  }
}

export function CodeRoute(req: Request, res: Response) {
  if (!req.session.user) {
    res.status(401).send("Not logged in");
    return;
  }
  createQRCode(req.session.user, (err, url) => {
    res.status(url ? 200 : 401).send({ error: err, data: url });
  });
}

function createQRCode(
  telegram: TelegramID,
  callback: (errorMessage: string, url?: string) => void
): void {
  User.findOne({
    where: {
      telegram: telegram,
    },
  })
    .then((user) => {
      user &&
        refreshVerification(user, (result) => {
          const verifyURL = `${
            process.env.WEBSITE_URL
          }/#/verify/${encodeURIComponent(result.verification)}`;
          QRCode.toDataURL(
            verifyURL,
            { width: 300, height: 300 } as QRCodeToDataURLOptions,
            (error, url) => {
              callback(error.message, url);
            }
          );
        });
    })
    .catch((error) => {
      callback(error);
    });
}

function refreshVerification(
  user: UserInstance,
  callback: (success: UserInstance) => void
): void {
  let newVerification = bcrypt
    .hashSync(`${new Date().getTime()}-${user.telegram}`, 5)
    .replace(/[^a-zA-Z0-9]+/g, "");
  newVerification = newVerification.substr(0, newVerification.length / 2);
  user.verification = newVerification;
  user.save().then((result) => {
    callback(result);
  });
}