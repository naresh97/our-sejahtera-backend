"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramWebhookRoute = void 0;
const types_1 = require("sequelize/types");
const db_1 = require("../db/db");
const telegram_1 = require("../telegram");
function TelegramWebhookRoute(req, res) {
    try {
        const messageText = req.body.message.text;
        const telegramID = req.body.message.from.id;
        if (messageText.toLowerCase() == "/covidpositive") {
            userInfected(telegramID, (result) => {
                if (result.saved) {
                    telegram_1.sendTelegramMessage(telegramID, "Thanks for informing us. We will notify the people you were in contact with!");
                    informContacts(telegramID);
                }
                else {
                    telegram_1.sendTelegramMessage(telegramID, "Sorry, something went wrong.");
                }
            });
        }
    }
    catch (e) {
        console.log("Could not get Telegram Message");
    }
    res.send();
}
exports.TelegramWebhookRoute = TelegramWebhookRoute;
function informContacts(telegramID) {
    db_1.User.findOne({
        where: {
            telegram: telegramID,
        },
    }).then((user) => {
        if (user) {
            const userRowID = user.id;
            db_1.Contact.findAll({
                where: {
                    [types_1.Op.or]: [{ user: userRowID }, { with: userRowID }],
                },
            }).then((result) => {
                result.forEach((contact) => {
                    const otherPersonID = contact.user == userRowID ? contact.with : contact.user;
                    db_1.User.findOne({
                        where: {
                            id: otherPersonID,
                        },
                    }).then((otherPerson) => {
                        otherPerson &&
                            telegram_1.sendTelegramMessage(otherPerson.telegram, "You're infected.");
                    });
                });
            });
        }
    });
}
function userInfected(telegramID, callback) {
    db_1.User.findOne({
        where: {
            telegram: telegramID,
        },
    })
        .then((user) => {
        if (!user) {
            callback({ saved: false });
        }
        else {
            user.isInfected = true;
            user
                .save()
                .then((result) => {
                if (result) {
                    callback({ saved: true });
                }
            })
                .catch((err) => {
                callback({ saved: false });
            });
        }
    })
        .catch((err) => {
        callback({ saved: false });
    });
}
