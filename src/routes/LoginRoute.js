const crypto = require("crypto");
const { User } = require("../db/db");
const { addContact, createUser } = require("../db/utils");

function LoginRoute(req, res) {
  const telegramResponse = req.body.telegramResponse;

  authUser(telegramResponse, (success, msg) => {
    if (success) {
      // User is already logged in
      if (req.session.user == telegramResponse.id) {
        res.send({ authorized: success });
        return;
      }

      const verified = req.session.verified;
      const verifiedBy = req.session.verifiedBy;
      req.session.regenerate(() => {
        req.session.user = telegramResponse.id;
        if (verified) {
          addContact(telegramResponse.id, verifiedBy, (contactSuccess) => {
            res.send({
              authorized: success,
              message: msg,
              contactSuccess: contactSuccess,
            });
          });
        } else {
          res.send({ authorized: success, message: msg });
        }
      });
    } else {
      res.status(401).send({ authorized: success, message: msg });
    }
  });
}

function authUser(telegramResponse, done) {
  let dataCheckArray = [];

  for (const [key, value] of Object.entries(telegramResponse)) {
    if (key == "hash") continue;
    dataCheckArray.push(`${key}=${value}`);
  }
  dataCheckArray.sort();
  const dataCheckString = dataCheckArray.join("\n");

  const secretKey = crypto
    .createHash("sha256")
    .update(process.env.TELEGRAM_TOKEN)
    .digest();
  const confirmationHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const authorized = confirmationHash == telegramResponse.hash;

  if (!authorized) {
    done({ authorized: false });
  }

  User.findOne({
    where: {
      telegram: telegramResponse.id,
    },
  }).then((user) => {
    if (!user) {
      createUser(telegramResponse.id, (success) => {
        done({ authorized: success });
      });
    } else {
      done({ authorized: true });
    }
  });
}

exports.LoginRoute = LoginRoute;
