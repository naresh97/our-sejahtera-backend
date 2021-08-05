/*
 * Branding allows to use nominal typing and avoid errors
 */
export type UserRowID = number & { __userRowIDBrand: any };
export type TelegramID = number & { __telegramIDBrand: any };
export type VerificationString = string & { __verificationStringBrand: any };

declare module "express-session" {
  interface Session {
    isVerified: boolean;
    verifiedByTelegramID: TelegramID;
    userTelegramID: TelegramID;
  }
}
