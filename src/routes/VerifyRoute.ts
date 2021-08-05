import { Request, Response } from "express";
import { User } from "../db/models/User";
import { getUserByVerification } from "../db/models/User.helper";
import { addContact } from "../db/utils";
import { UserRowID, VerificationString } from "../types";

interface VerifyRequest extends Request {
  body: {
    id: VerificationString;
  };
}

export function VerifyRoute(req: VerifyRequest, res: Response) {
  getUserByVerification(
    decodeURIComponent(req.body.id) as VerificationString,
    (verifiedByUser, message) => {
      if (!!verifiedByUser) {
        req.session.isVerified = !!verifiedByUser;
        req.session.verifiedByTelegramID = verifiedByUser.telegram;
        if (req.session.userTelegramID) {
          // If Logged In
          addContact(
            req.session.userTelegramID,
            verifiedByUser.telegram,
            (success, message) => {
              res
                .status(success ? 200 : 400)
                .send({ success: success, message: message, loggedIn: true });
            }
          );
        } else {
          // If Not Logged In
          res.send({
            success: !!verifiedByUser,
            message: message,
            loggedIn: false,
          });
        }
      } else {
        res.status(400).send({ success: !!verifiedByUser, message: message });
      }
    }
  );
}
