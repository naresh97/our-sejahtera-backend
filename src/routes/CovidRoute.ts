import { Request, Response } from "express";
import {
  getUserCovidPositivity,
  setUserCovidPositivity,
} from "../db/models/User.helper";
import { informContacts } from "../telegram";

interface CovidRouteRequest extends Request {
  body: {
    setPositive: boolean;
  };
}

export async function CovidRoute(req: CovidRouteRequest, res: Response) {
  if (!req.session.userTelegramID) {
    res.status(401).send("Not logged in");
    return;
  }
  try {
    if (req.body.setPositive) {
      await setUserCovidPositivity(req.session.userTelegramID, true);
      await informContacts(req.session.userTelegramID);
      res.send({ covidPositive: true });
    } else {
      const isInfected = await getUserCovidPositivity(
        req.session.userTelegramID
      );
      res.send({ covidPositive: isInfected });
    }
  } catch (error) {
    res
      .status(500)
      .send({ error: error instanceof Error ? error.message : "Error" });
  }
}
