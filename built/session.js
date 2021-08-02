"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOpts = exports.sessionOpts = void 0;
const db_1 = require("./db/db");
exports.sessionOpts = {
    secret: process.env.SERVER_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: "none",
        maxAge: Number(process.env.SESSION_LENGTH),
    },
    store: db_1.store,
};
exports.corsOpts = { credentials: true, origin: true, secure: true };
