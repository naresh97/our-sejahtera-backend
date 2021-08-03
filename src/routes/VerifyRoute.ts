import { Request, Response } from "express";
import { User, UserRowID, VerificationString } from "../db/db";
import { addContact } from "../db/utils";

interface VerifyRequest extends Request {
  body: {
    id: VerificationString;
  };
}

export function VerifyRoute(req: VerifyRequest, res: Response) {
  checkVerification(req.body.id, (success, msg, withUserID) => {
    if (success) {
      req.session.verified = success;
      req.session.verifiedBy = withUserID!;
      if (req.session.user) {
        // If Logged In
        addContact(req.session.user, withUserID!, (success, msg) => {
          res
            .status(success ? 200 : 400)
            .send({ success: success, message: msg, loggedIn: true });
        });
      } else {
        // If Not Logged In
        res.send({ success: success, message: msg, loggedIn: false });
      }
    } else {
      res.status(400).send({ success: success, message: msg });
    }
  });
}

function checkVerification(
  verification: VerificationString,
  callback: (success: boolean, msg: string, userID?: UserRowID) => void
): void {
  User.findOne({
    where: {
      verification: decodeURIComponent(verification),
    },
  }).then((user) => {
    if (user) {
      callback(true, "User verified", user.id);
    } else {
      callback(false, "No such verification");
    }
  });
}