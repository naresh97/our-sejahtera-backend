export type UserRowID = number;
export type TelegramID = number;
export type VerificationString = string;

declare module "express-session" {
  interface Session {
    verified: boolean;
    verifiedBy: UserRowID;
    user: TelegramID;
  }
}
