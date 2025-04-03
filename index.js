import express from 'express';
import { sequelize } from './src/database/database.js';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { User } from './src/models/users.js';
import { Service } from './src/models/services.js';
import { Reservation } from './src/models/reservations.js';
import { mainRouter } from './src/routes/index.js';

dotenv.config();

const { PORT, LOCALHOST } = process.env;

const app = express();

app.use(cookieParser())

app.use(cors({
    origin: LOCALHOST,
    credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("server Working 🚀");
});

app.use("/", mainRouter);

async function main() {
    try {
        await sequelize.sync({ force: false });

        app.listen(PORT, () => {
            console.log(`🚀 Server is listening on port ${PORT}`)
        })
    } catch (error) {
        console.log("❌ Connection failed", error.message)
    }
};

User.hasMany(Reservation, { foreignKey: "userId" });
Reservation.belongsTo(User, { foreignKey: "userId", allowNull: true });

Service.hasMany(Reservation, { foreignKey: "serviceId" });
Reservation.belongsTo(Service, { foreignKey: "serviceId", allowNull: false });

main();

export default app;