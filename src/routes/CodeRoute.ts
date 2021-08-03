import { Request, Response } from "express";
import bcrypt from "bcrypt";
import QRCode, { QRCodeToDataURLOptions } from "qrcode";
import { TelegramID, VerificationString } from "../types";
import { User, UserInstance } from "../db/models/User";
import { getUserByTelegramID } from "../db/models/User.helper";

export function CodeRoute(req: Request, res: Response) {
  if (!req.session.userTelegramID) {
    res.status(401).send("Not logged in");
    return;
  }
  createQRCode(req.session.userTelegramID, (err, url) => {
    res.status(url ? 200 : 401).send({ error: err, data: url });
  });
}

function createQRCode(
  telegram: TelegramID,
  callback: (errorMessage: string | Error, url?: string) => void
): void {
  getUserByTelegramID(telegram, (user) => {
    !!user &&
      refreshVerification(user, (result) => {
        const verifyURL = `${
          process.env.WEBSITE_URL
        }/#/verify/${encodeURIComponent(result.verification)}`;
        QRCode.toDataURL(
          verifyURL,
          { width: 300, height: 300 } as QRCodeToDataURLOptions,
          (error, url) => {
            callback(error, url);
          }
        );
      });
  });
}

function refreshVerification(
  user: UserInstance,
  callback: (success: UserInstance) => void
): void {
  let newVerification = bcrypt
    .hashSync(`${new Date().getTime()}-${user.telegram}`, 5)
    .replace(/[^a-zA-Z0-9]+/g, "") as VerificationString;
  newVerification = newVerification.substr(
    0,
    newVerification.length / 2
  ) as VerificationString;
  user.verification = newVerification;
  user.save().then((result) => {
    callback(result);
  });
}
