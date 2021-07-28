const { store } = require("./db/db");

const sessionOpts = {
  secret: process.env.SERVER_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none",
    maxAge: Number(process.env.SESSION_LENGTH),
  },
  store: store,
};

const corsOpts = { credentials: true, origin: true, secure: true };

exports.sessionOpts = sessionOpts;
exports.corsOpts = corsOpts;
