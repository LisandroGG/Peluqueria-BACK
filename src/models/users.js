import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { hashPassword } from "../helpers/password.js";

export const User = sequelize.define(
    "User",
    {
        userId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "user"
        }
    }, {
        timestamps: false
    }
);

User.beforeCreate(async (user) => {
    user.password = await hashPassword(user.password);
});