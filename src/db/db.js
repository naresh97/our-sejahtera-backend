const session = require("express-session");
const { Sequelize, DataTypes } = require("sequelize");
var SequelizeStore = require("connect-session-sequelize")(session.Store);

const isProduction = process.env.NODE_ENV == "production";

const sequelize = (() => {
  if (isProduction) {
    return new Sequelize(
      process.env.DB_DATA_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_PATH,
        dialect: process.env.DB_DATA_DIALECT,
      }
    );
  } else {
    return new Sequelize("sqlite::memory:");
  }
})();

const storeDB = (() => {
  if (isProduction) {
    return new Sequelize(
      process.env.DB_STORE_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_PATH,
        dialect: process.env.DB_DATA_DIALECT,
      }
    );
  } else {
    return new Sequelize("sqlite::memory:");
  }
})();

const store = new SequelizeStore({
  db: storeDB,
  expiration: process.env.COOKIE_EXPIRY_DURATION,
});
store.sync();

const Contact = sequelize.define("Contact", {
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

const User = sequelize.define("User", {
  telegram: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  verification: {
    type: DataTypes.STRING,
  },
});

User.sync().then(() => {
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    User.create({
      telegram: process.env.ADMIN_USERNAME,
    }).catch(() => {
      console.log("Couldn't create admin account. Probably exists.");
    });
  }
});

exports.User = User;
exports.Contact = Contact;
exports.sequelize = sequelize;
exports.storeDB = storeDB;
exports.store = store;
