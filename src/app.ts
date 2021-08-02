import express = require("express");
import session = require("express-session");
import cors = require("cors");
import { corsOpts, sessionOpts } from "./session";
import { TelegramWebhookRoute } from "./routes/TelegramWebhookRoute";
import { LoginRoute } from "./routes/LoginRoute";
import { CodeRoute } from "./routes/CodeRoute";
import { VerifyRoute } from "./routes/VerifyRoute";
require("dotenv-flow").config();

console.log(`Node Environment: ${process.env.NODE_ENV}`);

const app = express();
app.set("trust proxy", 1);
app.use(session(sessionOpts));
app.use(cors(corsOpts));
app.use(express.json());

app.post(`/${process.env.TELEGRAM_SECRET}`, TelegramWebhookRoute);
app.post("/login", LoginRoute);
app.get("/code", CodeRoute);
app.post("/verify", VerifyRoute);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
