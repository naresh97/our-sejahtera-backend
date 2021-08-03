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
