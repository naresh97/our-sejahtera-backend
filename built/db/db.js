"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Contact = exports.store = exports.storeDB = exports.sequelize = void 0;
const connect_session_sequelize_1 = __importDefault(require("connect-session-sequelize"));
const express_session_1 = __importDefault(require("express-session"));
const sequelize_1 = require("sequelize");
const SequelizeStore = connect_session_sequelize_1.default(express_session_1.default.Store);
const isProduction = process.env.NODE_ENV == "production";
exports.sequelize = (() => {
    if (isProduction) {
        return new sequelize_1.Sequelize(process.env.DB_DATA_NAME || "DATABASE", process.env.DB_USER || "USERNAME", process.env.DB_PASS || "PASSWORD", {
            host: process.env.DB_PATH || "localhost",
            dialect: "postgres",
        });
    }
    else {
        return new sequelize_1.Sequelize("sqlite::memory:");
    }
})();
exports.storeDB = (() => {
    if (isProduction) {
        return new sequelize_1.Sequelize(process.env.DB_STORE_NAME || "DATABASE", process.env.DB_USER || "USERNAME", process.env.DB_PASS || "PASSWORD", {
            host: process.env.DB_PATH,
            dialect: "postgres",
        });
    }
    else {
        return new sequelize_1.Sequelize("sqlite::memory:");
    }
})();
exports.store = new SequelizeStore({
    db: exports.storeDB,
});
exports.Contact = exports.sequelize.define("Contact", {
    user: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    with: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
});
exports.User = exports.sequelize.define("User", {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    telegram: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    verification: {
        type: sequelize_1.DataTypes.STRING,
    },
    isInfected: {
        type: sequelize_1.DataTypes.BOOLEAN,
    },
});
exports.Contact.sync();
exports.User.sync().then(() => {
    if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
        exports.User.create({
            telegram: 12345,
        }).catch(() => {
            console.log("Couldn't create admin account. Probably exists.");
        });
    }
});
exports.store.sync();
