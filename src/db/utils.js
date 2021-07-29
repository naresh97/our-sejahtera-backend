const { strings_en } = require("../strings");
const { sendTelegramMessage } = require("../telegram");
const { User, Contact } = require("./db");

function addContact(telegram, withUserID, done) {
  User.findOne({ where: { telegram: telegram } }).then((user) => {
    User.findOne({ where: { id: withUserID } }).then((withUser) => {
      Contact.create({ user: user.id, with: withUserID })
        .then(() => {
          console.log(
            `Registering contact between ${user.id} and ${withUserID}`
          );
          sendTelegramMessage(
            withUser.telegram,
            strings_en.telegram_qr_scanned,
            () => {}
          );
          done(true, "Successfully added contact");
        })
        .catch((e) => {
          done(false, e);
        });
    });
  });
}

function createUser(telegram, done) {
  User.create({
    telegram: telegram,
  })
    .then((user) => {
      if (!user) {
        done(false, "Could not create user");
      } else {
        done(true, "Success");
      }
    })
    .catch((reason) => {
      if (reason.name == "SequelizeUniqueConstraintError") {
        done(false, "User already exists");
      } else {
        done(false, "Unknown error");
      }
    });
}

exports.addContact = addContact;
exports.createUser = createUser;
