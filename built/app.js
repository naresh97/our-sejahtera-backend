"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const session_1 = require("./session");
const TelegramWebhookRoute_1 = require("./routes/TelegramWebhookRoute");
const LoginRoute_1 = require("./routes/LoginRoute");
const CodeRoute_1 = require("./routes/CodeRoute");
const VerifyRoute_1 = require("./routes/VerifyRoute");
require("dotenv-flow").config();
console.log(`Node Environment: ${process.env.NODE_ENV}`);
const app = express();
app.set("trust proxy", 1);
app.use(session(session_1.sessionOpts));
app.use(cors(session_1.corsOpts));
app.use(express.json());
app.post(`/${process.env.TELEGRAM_SECRET}`, TelegramWebhookRoute_1.TelegramWebhookRoute);
app.post("/login", LoginRoute_1.LoginRoute);
app.get("/code", CodeRoute_1.CodeRoute);
app.post("/verify", VerifyRoute_1.VerifyRoute);
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});