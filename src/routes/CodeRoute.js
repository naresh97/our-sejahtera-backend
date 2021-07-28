const bcrypt = require("bcrypt");
const QRCode = require("qrcode");
const { User } = require("../db/db");

function CodeRoute(req, res) {
  if (!req.session.user) {
    res.status(401).send("Not logged in");
    return;
  }
  createQRCode(req.session.user, (err, url) => {
    res.status(url ? 200 : 401).send({ error: err, data: url });
  });
}

function createQRCode(telegram, done) {
  User.findOne({
    where: {
      telegram: telegram,
    },
  })
    .then((user) => {
      refreshVerification(user, (result) => {
        const verifyURL = `${
          process.env.WEBSITE_URL
        }/#/verify/${encodeURIComponent(result.verification)}`;
        QRCode.toDataURL(verifyURL, { width: 300, height: 300 }, (err, url) => {
          done(err, url);
        });
      });
    })
    .catch((err) => {
      done(err);
    });
}

function refreshVerification(user, done) {
  let newVerification = bcrypt
    .hashSync(`${new Date().getTime()}-${user.hash}`, 5)
    .replace(/[^a-zA-Z0-9]+/g, "");
  newVerification = newVerification.substr(0, newVerification.length / 2);
  user.verification = newVerification;
  user.save().then((result) => {
    done(result);
  });
}

exports.CodeRoute = CodeRoute;
