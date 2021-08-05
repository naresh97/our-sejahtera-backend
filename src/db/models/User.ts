import { DataTypes, Model } from "sequelize";
import { TelegramID, UserRowID, VerificationString } from "../../types";
import { sequelize } from "../db";

interface UserAttributes {
  id: UserRowID;
  telegram: TelegramID;
  verification: VerificationString;
  isInfected: boolean;
  infectionDate: Date;
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
    defaultValue: false,
  },
  infectionDate: {
    type: DataTypes.DATE,
  },
});

User.sync().then(() => {
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    User.create({
      telegram: 12345 as TelegramID,
    }).catch(() => {
      console.log("Couldn't create admin account. Probably exists.");
    });
  }
});
