"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeRoute = void 0;
const db_1 = require("../db/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const qrcode_1 = __importDefault(require("qrcode"));
function CodeRoute(req, res) {
    if (!req.session.user) {
        res.status(401).send("Not logged in");
        return;
    }
    createQRCode(req.session.user, (err, url) => {
        res.status(url ? 200 : 401).send({ error: err, data: url });
    });
}
exports.CodeRoute = CodeRoute;
function createQRCode(telegram, callback) {
    db_1.User.findOne({
        where: {
            telegram: telegram,
        },
    })
        .then((user) => {
        user &&
            refreshVerification(user, (result) => {
                const verifyURL = `${process.env.WEBSITE_URL}/#/verify/${encodeURIComponent(result.verification)}`;
                qrcode_1.default.toDataURL(verifyURL, { width: 300, height: 300 }, (error, url) => {
                    callback(error.message, url);
                });
            });
    })
        .catch((error) => {
        callback(error);
    });
}
function refreshVerification(user, callback) {
    let newVerification = bcrypt_1.default
        .hashSync(`${new Date().getTime()}-${user.telegram}`, 5)
        .replace(/[^a-zA-Z0-9]+/g, "");
    newVerification = newVerification.substr(0, newVerification.length / 2);
    user.verification = newVerification;
    user.save().then((result) => {
        callback(result);
    });
}
