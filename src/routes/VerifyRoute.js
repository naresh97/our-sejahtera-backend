const { User } = require("../db/db");
const { addContact } = require("../db/utils");

function VerifyRoute(req, res) {
    checkVerification(req.body.id, (success, msg, withUserID) => {
      req.session.verified = success;
      req.session.verifiedBy = withUserID;

      if (success) {
        if (req.session.user) {
          // If Logged In
          addContact(req.session.user, withUserID, (success, msg) => {
            res
              .status(success ? 200 : 400)
              .send({ success: success, message: msg, loggedIn: true });
          });
        } else {
          // If Not Logged In
          res.send({ success: success, message: msg, loggedIn: false });
        }
      } else {
        res.status(400).send({ success: success, message: msg });
      }
    });
}

function checkVerification(id, done) {
  User.findOne({
    where: {
      verification: decodeURIComponent(id),
    },
  }).then((user) => {
    if (user) {
      done(true, "User verified", user.id);
    } else {
      done(false, "No such verification");
    }
  });
}

exports.VerifyRoute = VerifyRoute;
