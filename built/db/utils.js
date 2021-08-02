"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.addContact = void 0;
const telegram_1 = require("../telegram");
const db_1 = require("./db");
function addContact(userATelegram, userBRowID, done) {
    db_1.User.findOne({ where: { telegram: userATelegram } }).then((userA) => {
        db_1.User.findOne({ where: { id: userBRowID } }).then((userB) => {
            if (!!userA || !!userB) {
                done(false, "Could not find user.");
                return;
            }
            db_1.Contact.create({ user: userA.id, with: userBRowID })
                .then(() => {
                console.log(`Registering contact between ${userA.id} and ${userBRowID}`);
                telegram_1.sendTelegramMessage(userB.telegram, "Someone scanned your QR code. You will be notified if they are tested positive with Covid. If you are tested positive, please tell this bot /COVIDPOSITIVE");
                done(true, "Successfully added contact");
            })
                .catch((e) => {
                done(false, e);
            });
        });
    });
}
exports.addContact = addContact;
function createUser(telegram, callback) {
    db_1.User.create({
        telegram: telegram,
    })
        .then((user) => {
        if (!user) {
            callback(false, "Could not create user");
        }
        else {
            callback(true, "Success");
        }
    })
        .catch((reason) => {
        if (reason.name == "SequelizeUniqueConstraintError") {
            callback(false, "User already exists");
        }
        else {
            callback(false, "Unknown error");
        }
    });
}
exports.createUser = createUser;
