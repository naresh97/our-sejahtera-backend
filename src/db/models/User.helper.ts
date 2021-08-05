import { TelegramID, UserRowID, VerificationString } from "../../types";
import { User, UserInstance } from "./User";

export function getUserByTelegramID(
  telegramID: TelegramID,
  callback: (user?: UserInstance, message?: string) => void
): void {
  User.findOne({
    where: {
      telegram: telegramID,
    },
  })
    .then((result) => {
      callback(!!result ? result : undefined);
    })
    .catch(() => {
      callback(undefined);
    });
}

export function getUserByRowID(
  rowID: UserRowID,
  callback: (user?: UserInstance, message?: string) => void
): void {
  User.findOne({
    where: {
      id: rowID,
    },
  })
    .then((result) => {
      callback(!!result ? result : undefined);
    })
    .catch(() => {
      callback(undefined);
    });
}

export function getUserByVerification(
  verification: VerificationString,
  callback: (user?: UserInstance, message?: string) => void
): void {
  User.findOne({
    where: {
      verification: verification,
    },
  })
    .then((result) => {
      callback(!!result ? result : undefined);
    })
    .catch(() => {
      callback(undefined);
    });
}

export function getUserCovidPositivity(telegramID: TelegramID, callback: (isInfected?: boolean) => void): void {
  getUserByTelegramID(telegramID, user => {
    if (!!user) {
      const infectionDuration = Date.now() - +user.infectionDate;
      if (infectionDuration > 60 * 60 * 24 * 14 * 1000) {
        setUserCovidPositivity(telegramID, false, success => {
          callback(success ? false : undefined);
        });
      } else {
        callback(user.isInfected);
      }
    } else {
      callback();
    }
  });
}

export function setUserCovidPositivity(telegramID: TelegramID, infectionState: boolean, callback: (success: boolean) => void): void {
  getUserByTelegramID(telegramID, user => {
    if (!!user) {
      user.isInfected = infectionState;
      user.infectionDate = new Date();
      user.save().then(() => callback(true)).catch(() => callback(false));
    } else { callback(false) }
  });
}
