import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';

export const Reservation = sequelize.define(
    "Reservation",
    {
        reservationId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        reservationDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        clientName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },{
        timestamps: false
    }
);