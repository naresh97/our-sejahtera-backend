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
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING,
    },
    hash: {
        type: STRING,
    },
    phoneNumber: {
        type: DataTypes.STRING,
    },
    verification: {
        type: DataTypes.STRING,
    },
    org: {
        type: DataTypes.STRING,
    },
});

User.sync().then(() => {
    User.create({
        email: "admin@msolidariti.org",
        name: "Demo",
        hash: bcrypt.hashSync("test", 10),
        phoneNumber: "123",
    }).catch(e => {
        console.log("Couldn't create demo account. Probably exists.");
    });
});


function authUser(email, password, done) {
    User.findOne({
        where: {
            email: email
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

function createQRCode(email, done) {

    User.findOne({
        where: {
            email: email
        }
    }).then(user => {
        refreshVerification(user, result => {
            const verifyURL = `${process.env.SERVER_API_URL}/verify/${encodeURIComponent(result.verification)}`;
            QRCode.toDataURL(verifyURL, { width: 300, height: 300 }, (err, url) => {
                done(err, url);
            })
        });
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

function createUser(email, password, name, phoneNumber, done) {
    hash = bcrypt.hashSync(password, 10);
    User.create({
        email: email,
        name: name,
        hash: hash,
        phoneNumber: phoneNumber,
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

function addContact(userEmail, withUserID, done) {
    User.findOne({ where: { email: userEmail } }).then(user => {
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
    }
}))
app.use(cors({ credentials: true, origin: true, secure: true }));
app.use(express.json())

app.post('/login', (req, res) => {
    reqEmail = req.body.email.toLowerCase();
    const auth = authUser(reqEmail, req.body.password, (success, msg) => {
        if (success) {
            req.session.regenerate(() => {
                cookieExpiry = getCookieExpiry();
                req.session.user = reqEmail;
                res.send({ authorized: success, message: msg })
            });
        } else {
            res.status(401).send({ authorized: success, message: msg });
        }
    });
});

app.post('/create', (req, res) => {
    reqEmail = req.body.email.toLowerCase();
    if (req.session.verified) {
        createUser(reqEmail, req.body.password, req.body.name, req.body.phoneNumber, (success, msg) => {
            cookieExpiry = getCookieExpiry();
            req.session.user = reqEmail;
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
        res.send({ error: err, data: url });
    });
})

app.get("/verify/:id", (req, res) => {
    checkVerification(req.params.id, (success, msg, withUserID) => {
        cookieExpiry = getCookieExpiry();
        req.session.verified = success;
        req.session.verifiedBy = withUserID;

        if (success) {
            if (req.session.user) { // If Logged In
                addContact(req.session.user, withUserID, (success, msg) => {
                    if (success) {
                        res.redirect(`${process.env.WEBSITE_URL}/#/success`)
                    } else {
                        res.status(400).send(msg);
                    }
                });
            } else { // If Not Logged In
                if (success) {
                    res.redirect(`${process.env.WEBSITE_URL}/#/create`)
                } else {
                    res.status(400).send(msg);
                }
            }
        } else {
            res.status(400).send(msg);
        }
    });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})