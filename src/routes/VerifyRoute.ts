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

export async function VerifyRoute(req: VerifyRequest, res: Response) {
  const verifiedByUser = await getUserByVerification(
    decodeURIComponent(req.body.id) as VerificationString
  );
  try{
    if (!!verifiedByUser) {
      req.session.isVerified = !!verifiedByUser;
      req.session.verifiedByTelegramID = verifiedByUser.telegram;
      if (req.session.userTelegramID) {
        // If Logged In
        await addContact(req.session.userTelegramID, verifiedByUser.telegram);
        res.send({ success: true, loggedIn: true });
      } else {
        // If Not Logged In
        res.send({
          success: false,
          loggedIn: false,
        });
      }
    } else {
      res.status(400).send({ success: false });
    }
  }catch(e){
    res.status(500).send({error: e instanceof Error ? e.message : "Error"});
  }
}
