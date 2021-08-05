import { DataTypes, Model } from "sequelize";
import { UserRowID } from "../../types";
import { sequelize } from "../db";

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

Contact.sync();
