"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyRoute = void 0;
const db_1 = require("../db/db");
const utils_1 = require("../db/utils");
function VerifyRoute(req, res) {
    checkVerification(req.body.id, (success, msg, withUserID) => {
        if (success) {
            req.session.verified = success;
            req.session.verifiedBy = withUserID;
            if (req.session.user) {
                // If Logged In
                utils_1.addContact(req.session.user, withUserID, (success, msg) => {
                    res
                        .status(success ? 200 : 400)
                        .send({ success: success, message: msg, loggedIn: true });
                });
            }
            else {
                // If Not Logged In
                res.send({ success: success, message: msg, loggedIn: false });
            }
        }
        else {
            res.status(400).send({ success: success, message: msg });
        }
    });
}
exports.VerifyRoute = VerifyRoute;
function checkVerification(verification, callback) {
    db_1.User.findOne({
        where: {
            verification: decodeURIComponent(verification),
        },
    }).then((user) => {
        if (user) {
            callback(true, "User verified", user.id);
        }
        else {
            callback(false, "No such verification");
        }
    });
}
exports.VerifyRoute = VerifyRoute;
