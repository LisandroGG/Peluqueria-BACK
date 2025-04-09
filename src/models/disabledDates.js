import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const DisabledDate = sequelize.define(
    "DisableDate",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            unique: true,
        },
        reason: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },
    {
        timestamps: false
    }
)