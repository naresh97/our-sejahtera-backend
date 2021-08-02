import ConnectSessionSequelize from "connect-session-sequelize";
import session from "express-session";
import { DataTypes, Model, Optional, Sequelize } from "sequelize";

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

export type UserRowID = number;
export type TelegramID = number;
export type VerificationString = string;

interface ContactAttributes {
  user: UserRowID;
  with: UserRowID;
}
export interface ContactInterface
  extends Model<ContactAttributes, ContactAttributes>,
    ContactAttributes {}
export const Contact = sequelize.define<ContactInterface>("Contact", {
  user: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  with: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

interface UserAttributes {
  id: UserRowID;
  telegram: TelegramID;
  verification: VerificationString;
  isInfected: boolean;
}
interface UserCreationAttributes {
  telegram: TelegramID;
}
export interface UserInstance
  extends Model<UserAttributes, UserCreationAttributes>,
    UserAttributes {}

export const User = sequelize.define<UserInstance>("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  telegram: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  verification: {
    type: DataTypes.STRING,
  },
  isInfected: {
    type: DataTypes.BOOLEAN,
  },
});

Contact.sync();

User.sync().then(() => {
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    User.create({
      telegram: 12345,
    }).catch(() => {
      console.log("Couldn't create admin account. Probably exists.");
    });
  }
});

store.sync();
