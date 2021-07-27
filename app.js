const express = require('express');
const { Sequelize, DataTypes, STRING } = require('sequelize');
const session = require('express-session');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const cors = require('cors');
const { createSecureServer } = require('http2');
require("dotenv-flow").config();

var SequelizeStore = require("connect-session-sequelize")(session.Store);

const COOKIE_EXPIRY_DURATION = 60 * 60 * 3 * 1000; // 3 hours in milliseconds

const isProduction = process.env.NODE_ENV == "production";
const isDev = process.env.NODE_ENV == "development";

console.log(`Node Environment: ${process.env.NODE_ENV}`);

const sequelize = (() => {
    if (isProduction) {
        return new Sequelize(process.env.DB_DATA_NAME, process.env.DB_USER, process.env.DB_PASS, {
            host: process.env.DB_PATH,
            dialect: process.env.DB_DATA_DIALECT,
        });
    } else {
        return new Sequelize('sqlite::memory:');
    }
})();

const storeDB = (() => {
    if (isProduction) {
        return new Sequelize(process.env.DB_STORE_NAME, process.env.DB_USER, process.env.DB_PASS, {
            host: process.env.DB_PATH,
            dialect: process.env.DB_DATA_DIALECT,
        });
    } else {
        return new Sequelize('sqlite::memory:');
    }
})();

const store = new SequelizeStore({
    db: storeDB,
    expiration: COOKIE_EXPIRY_DURATION,
});
store.sync();

const Contact = sequelize.define('Contact', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    with: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});
Contact.sync();

const User = sequelize.define('User', {
    telegram: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    hash: {
        type: STRING,
    },
    verification: {
        type: DataTypes.STRING,
    },
});

User.sync().then(() => {
    if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
        User.create({
            telegram: process.env.ADMIN_USERNAME,
            hash: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
        }).catch(e => {
            console.log("Couldn't create admin account. Probably exists.");
        });
    }
});


function authUser(telegram, password, done) {
    User.findOne({
        where: {
            telegram: telegram
        }
    }).then(user => {
        if (!user) {
            done(false, "User not found")
        } else {
            const auth = bcrypt.compareSync(password, user.hash);
            done(auth, auth ? "Authorized" : "Wrong password");
        }
    });
}

function refreshVerification(user, done) {
    let newVerification = bcrypt.hashSync(`${new Date().getTime()}-${user.hash}`, 5).replace(/[^a-zA-Z0-9]+/g, "");
    newVerification = newVerification.substr(0, newVerification.length / 2);
    user.verification = newVerification;
    user.save().then(result => {
        done(result)
    });
}

function createQRCode(telegram, done) {

    User.findOne({
            where: {
                telegram: telegram
            }
        })
        .then(user => {
            refreshVerification(user, result => {
                const verifyURL = `${process.env.WEBSITE_URL}/#/verify/${encodeURIComponent(result.verification)}`;
                QRCode.toDataURL(verifyURL, { width: 300, height: 300 }, (err, url) => {
                    done(err, url);
                })
            });
        })
        .catch(err => {
            done(err);
        });
}

function checkVerification(id, done) {
    User.findOne({
        where: {
            verification: decodeURIComponent(id),
        }
    }).then(user => {
        if (user) {
            done(true, "User verified", user.id);
        } else {
            done(false, "No such verification");
        }
    });
}

function createUser(telegram, password, done) {
    hash = bcrypt.hashSync(password, 10);
    User.create({
        telegram: telegram,
        hash: hash,
    }).then(user => {
        if (!user) {
            done(false, "Could not create user");
        } else {
            done(true, "Success");
        }
    }).catch(reason => {
        if (reason.name == "SequelizeUniqueConstraintError") {
            done(false, "User already exists");
        } else {
            done(false, "Unknown error");
        }
    });
}

function addContact(telegram, withUserID, done) {
    User.findOne({ where: { telegram: telegram } }).then(user => {
        Contact.create({ user: user.id, with: withUserID })
            .then(res => {
                done(true, "Successfully added contact");
            })
            .catch(e => {
                done(false, e);
            });
    })
}

function getCookieExpiry() {
    return new Date(Date.now() + COOKIE_EXPIRY_DURATION);
}

const app = express();
app.set('trust proxy', 1)
app.use(session({
    secret: process.env.SERVER_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: "none",
    },
    store: store,
}))
app.use(cors({ credentials: true, origin: true, secure: true }));
app.use(express.json())

app.post('/login', (req, res) => {
    reqTelegram = req.body.telegram.toLowerCase();
    const auth = authUser(reqTelegram, req.body.password, (success, msg) => {
        if (success) {
            req.session.regenerate(() => {
                cookieExpiry = getCookieExpiry();
                req.session.user = reqTelegram;
                res.send({ authorized: success, message: msg })
            });
        } else {
            res.status(401).send({ authorized: success, message: msg });
        }
    });
});

app.post('/create', (req, res) => {
    reqTelegram = req.body.telegram.toLowerCase();
    if (req.session.verified) {
        createUser(reqTelegram, req.body.password, (success, msg) => {
            cookieExpiry = getCookieExpiry();
            req.session.user = reqTelegram;
            if (success) {
                addContact(req.session.user, req.session.verifiedBy, (sucesss, msg) => {
                    res.send({ success: success, message: msg });
                });
            } else {
                res.send({ success: success, message: msg });
            }
        });
    } else {
        res.status(401).send("Not verified");
    }
})

app.get('/code', (req, res) => {
    if (!req.session.user) {
        res.status(401).send("Not logged in");
        return;
    }
    createQRCode(req.session.user, (err, url) => {
        res.status(url ? 200 : 401).send({ error: err, data: url });
    });
})

app.post("/verify", (req, res) => {
    checkVerification(req.body.id, (success, msg, withUserID) => {
        cookieExpiry = getCookieExpiry();
        req.session.verified = success;
        req.session.verifiedBy = withUserID;

        if (success) {
            if (req.session.user) { // If Logged In
                addContact(req.session.user, withUserID, (success, msg) => {
                    res.status(success ? 200 : 400).send({ success: success, message: msg, loggedIn: true });
                });
            } else { // If Not Logged In
                res.send({ success: success, message: msg, loggedIn: false })
            }
        } else {
            res.status(400).send({ success: success, message: msg });
        }
    });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})