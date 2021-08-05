import { SessionOptions } from "express-session";
import { store } from "./db/db";

export const sessionOpts: SessionOptions = {
  secret: process.env.SERVER_SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none",
    maxAge: Number(process.env.SESSION_LENGTH),
  },
  store: store,
};

export const corsOpts = { credentials: true, origin: true, secure: true };
