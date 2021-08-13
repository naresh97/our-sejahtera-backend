import crypto from "crypto";
import { Request, Response } from "express";
import { addContact } from "../db/models/Contact.helper";
import { createUser, getUserByTelegramID } from "../db/models/User.helper";
import { TelegramID } from "../types";

type TelegramLoginResponse = {
  id: TelegramID;
  hash: string;
};

interface LoginRequest extends Request {
  body: {
    telegramResponse: TelegramLoginResponse;
  };
}

export async function LoginRoute(req: LoginRequest, res: Response) {
  const telegramResponse = req.body.telegramResponse;
  try {
    const authorized = await authUser(telegramResponse);
    if (authorized) {
      // User is already logged in
      if (req.session.userTelegramID == telegramResponse.id) {
        res.send({ authorized: authorized });
        return;
      }
      // User not logged in
      const verified = req.session.isVerified;
      const verifiedBy = req.session.verifiedByTelegramID;
      req.session.regenerate(async () => {
        req.session.userTelegramID = telegramResponse.id;
        if (verified) {
          await addContact(telegramResponse.id, verifiedBy);
          res.send({
            authorized: true,
            contactSuccess: true,
          });
        } else {
          res.send({ authorized: authorized });
        }
      });
    } else {
      res.status(401).send({ error: "Unauthorized" });
    }
  } catch (error) {
    res
      .status(500)
      .send({ error: error instanceof Error ? error.message : "Error" });
  }
}

async function authUser(
  telegramResponse: TelegramLoginResponse
): Promise<boolean> {
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
    return false;
  }

  const user = await getUserByTelegramID(telegramResponse.id);
  if (!!user) {
    return true;
  } else {
    return !!(await createUser(telegramResponse.id));
  }
}
