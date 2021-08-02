"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginRoute = void 0;
const db_1 = require("../db/db");
const crypto_1 = __importDefault(require("crypto"));
const utils_1 = require("../db/utils");
function LoginRoute(req, res) {
    const telegramResponse = req.body.telegramResponse;
    authUser(telegramResponse, (authObject) => {
        if (authObject) {
            const verified = req.session.verified;
            const verifiedBy = req.session.verifiedBy;
            req.session.regenerate(() => {
                req.session.user = telegramResponse.id;
                if (verified) {
                    utils_1.addContact(telegramResponse.id, verifiedBy, (contactSuccess) => {
                        res.send({
                            authorized: authObject.authorized,
                            contactSuccess: contactSuccess,
                        });
                    });
                }
                else {
                    res.send(authObject);
                }
            });
        }
        else {
            res.status(401).send(authObject);
        }
    });
}
exports.LoginRoute = LoginRoute;
function authUser(telegramResponse, callback) {
    let dataCheckArray = [];
    for (const [key, value] of Object.entries(telegramResponse)) {
        if (key == "hash")
            continue;
        dataCheckArray.push(`${key}=${value}`);
    }
    dataCheckArray.sort();
    const dataCheckString = dataCheckArray.join("\n");
    const secretKey = crypto_1.default
        .createHash("sha256")
        .update(process.env.TELEGRAM_TOKEN)
        .digest();
    const confirmationHash = crypto_1.default
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");
    const authorized = confirmationHash == telegramResponse.hash;
    if (!authorized) {
        callback({ authorized: false });
    }
    db_1.User.findOne({
        where: {
            telegram: telegramResponse.id,
        },
    }).then((user) => {
        if (!user) {
            utils_1.createUser(telegramResponse.id, (success) => {
                callback({ authorized: success });
            });
        }
        else {
            callback({ authorized: true });
        }
    });
}
exports.LoginRoute = LoginRoute;
