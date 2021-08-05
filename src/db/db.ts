import ConnectSessionSequelize from "connect-session-sequelize";
import session from "express-session";
import { Sequelize } from "sequelize";

const SequelizeStore = ConnectSessionSequelize(session.Store);

const isProduction: boolean = process.env.NODE_ENV == "production";

export const sequelize: Sequelize = (() => {
  if (isProduction) {
    return new Sequelize(
      process.env.DB_DATA_NAME || "DATABASE",
      process.env.DB_USER || "USERNAME",
      process.env.DB_PASS || "PASSWORD",
      {
        host: process.env.DB_PATH || "localhost",
        dialect: "postgres",
      }
    );
  } else {
    return new Sequelize("sqlite::memory:");
  }
})();

export const storeDB: Sequelize = (() => {
  if (isProduction) {
    return new Sequelize(
      process.env.DB_STORE_NAME || "DATABASE",
      process.env.DB_USER || "USERNAME",
      process.env.DB_PASS || "PASSWORD",
      {
        host: process.env.DB_PATH,
        dialect: "postgres",
      }
    );
  } else {
    return new Sequelize("sqlite::memory:");
  }
})();

export const store = new SequelizeStore({
  db: storeDB,
});
store.sync();
