import { Request, Response } from "express";
import bcrypt from "bcrypt";
import QRCode, { QRCodeToDataURLOptions } from "qrcode";
import { TelegramID, VerificationString } from "../types";
import { User, UserInstance } from "../db/models/User";
import { getUserByTelegramID } from "../db/models/User.helper";

export async function CodeRoute(req: Request, res: Response) {
  if (!req.session.userTelegramID) {
    res.status(401).send("Not logged in");
    return;
  }
  try {
    const url = await createQRCode(req.session.userTelegramID);
    res.send({ data: url });
  } catch (error) {
    res
      .status(500)
      .send({ error: error instanceof Error ? error.message : "Error" });
  }
}

async function createQRCode(telegram: TelegramID): Promise<string> {
  const user = await getUserByTelegramID(telegram);
  if (!user) throw new Error("User not found");
  const newVerification = await refreshVerification(user);
  const verifyURL = `${process.env.WEBSITE_URL}/#/verify/${encodeURIComponent(
    newVerification
  )}`;
  return await QRCode.toDataURL(verifyURL, {
    width: 300,
    height: 300,
  } as QRCodeToDataURLOptions);
}

async function refreshVerification(
  user: UserInstance
): Promise<VerificationString> {
  let newVerification = bcrypt
    .hashSync(`${new Date().getTime()}-${user.telegram}`, 5)
    .replace(/[^a-zA-Z0-9]+/g, "") as VerificationString;
  newVerification = newVerification.substr(
    0,
    newVerification.length / 2
  ) as VerificationString;
  user.verification = newVerification;
  await user.save();
  return newVerification;
}
