import * as dotenvFlow from "dotenv-flow";
dotenvFlow.config();

import express from "express";
import session from "express-session";
import cors from "cors";
import { corsOpts, sessionOpts } from "./session";
import { TelegramWebhookRoute } from "./routes/TelegramWebhookRoute";
import { LoginRoute } from "./routes/LoginRoute";
import { CodeRoute } from "./routes/CodeRoute";
import { VerifyRoute } from "./routes/VerifyRoute";

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
app.post("/covid", CovidRoute);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
