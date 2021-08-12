import { TelegramID, UserRowID, VerificationString } from "../../types";
import { User, UserInstance } from "./User";

export async function getUserByTelegramID(
  telegramID: TelegramID
): Promise<UserInstance | null> {
  const user = await User.findOne({
    where: {
      telegram: telegramID,
    },
  });
  return user;
}

export async function getUserByRowID(
  rowID: UserRowID
): Promise<UserInstance | null> {
  const user = await User.findOne({
    where: {
      id: rowID,
    },
  });
  return user;
}

export async function getUserByVerification(
  verification: VerificationString
): Promise<UserInstance | null> {
  const user = await User.findOne({
    where: {
      verification: verification,
    },
  });
  return user;
}

export async function getUserCovidPositivity(
  telegramID: TelegramID
): Promise<boolean> {
  const user = await getUserByTelegramID(telegramID);
  if (!user) throw new Error("User not found");
  if (!user.infectionDate) return false;
  const infectionDuration = new Date().getTime() - user.infectionDate.getTime();
  if (infectionDuration > 60 * 60 * 24 * 14 * 1000) {
    await setUserCovidPositivity(telegramID, false);
    return false;
  } else {
    return user.isInfected;
  }
}

export async function setUserCovidPositivity(
  telegramID: TelegramID,
  infectionState: boolean
): Promise<void> {
  const user = await getUserByTelegramID(telegramID);
  if (!user) throw new Error("User not found");
  user.isInfected = infectionState;
  user.infectionDate = new Date();
  if (!(await user.save())) throw new Error("Could not save user state");
}
