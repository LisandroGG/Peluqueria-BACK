import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js'

export const Service = sequelize.define(
    "Service",
    {
        serviceId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        serviceName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        serviceCost: {
            type: DataTypes.FLOAT,
            allowNull: false,
        }
    },{
        timestamps: false
    }
);