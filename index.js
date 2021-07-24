const express = require('express');
const cors = require('cors')
const { Sequelize, DataTypes, STRING } = require('sequelize');
const session = require('express-session');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const { createSecureServer } = require('http2');
require("dotenv").config();

const sequelize = new Sequelize('sqlite::memory:')

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

User.sync();

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
    const newVerification = bcrypt.hashSync(`${new Date().getTime()}-${user.hash}`, 5);
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
            const verifyURL = `${process.env.SERVER_API_URL}/verify/${result.verification}`;
            QRCode.toDataURL(verifyURL, { width: 300, height: 300 }, (err, url) => {
                done(err, url);
            })
        });
    });
}

function checkVerification() {

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

const app = express();
app.set('trust proxy', 1)
app.use(session({
    secret: process.env.SERVER_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}))
app.use(cors({ credentials: true, origin: process.env.WEBSITE_URL }))
app.use(express.json())

app.post('/login', (req, res) => {
    const auth = authUser(req.body.email, req.body.password, (success, msg) => {
        req.session.regenerate(() => {
            req.session.user = req.body.email;
            res.cookie("authorized", success, { domain: process.env.COOKIE_DOMAIN.split(","), sameSite: "none", secure: true });
            res.send({ authorized: success, message: msg })
        });
    });
});

app.post('/create', (req, res) => {
    if (!req.session.verified) {
        createUser(req.body.email, req.body.password, req.body.name, req.body.phoneNumber, (success, msg) => {
            req.session.user = req.body.email;
            res.cookie("authorized", success, { domain: process.env.COOKIE_DOMAIN.split(","), sameSite: "none", secure: true });
            res.send({ success: success, message: msg });
        });
    } else {
        res.status(401).send("Not verified");
    }
})

app.get('/code', (req, res) => {
    console.log(req.session)
    if (!req.session.user) {
        res.status(401).send("Not logged in");
        return;
    }
    createQRCode(req.session.user, (err, url) => {
        res.send({ error: err, data: url });
    });
})

app.get("/verify/:id", (req, res) => {
    checkVerification(req.params.id, (success, msg) => {
        req.session.verified = success;
        if (success) {
            res.redirect(`${process.env.WEBSITE_URL}/#/create`)
        }
    });
});

const port = process.env.SERVER_PORT;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})