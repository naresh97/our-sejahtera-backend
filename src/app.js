const express = require("express");
const session = require("express-session");
const cors = require("cors");
require("dotenv-flow").config();

const { LoginRoute } = require("./routes/LoginRoute");
const { CodeRoute } = require("./routes/CodeRoute");
const { VerifyRoute } = require("./routes/VerifyRoute");
const { corsOpts, sessionOpts } = require("./session");

console.log(`Node Environment: ${process.env.NODE_ENV}`);

const app = express();
app.set("trust proxy", 1);
app.use(session(sessionOpts));
app.use(cors(corsOpts));
app.use(express.json());

app.post(`/${process.env.TELEGRAM_SECRET}`, (req, res) => {
  res.send();
});

app.post("/login", LoginRoute);
app.get("/code", CodeRoute);
app.post("/verify", VerifyRoute);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
