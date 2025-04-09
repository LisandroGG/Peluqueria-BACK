import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const {MAILER_USER, MAILER_HOST, MAILER_PORT, MAILER_PASSWORD} = process.env;

export const transporter = nodemailer.createTransport({
    host: `${MAILER_HOST}`,
    port: `${MAILER_PORT}`,
    secure: "true",
    auth: {
        user: `${MAILER_USER}`,
        pass: `${MAILER_PASSWORD}`
    },
});

export const sendForgotPassword = async(user, email) => {
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });

    try {
        await transporter.sendMail({
            from: `${MAILER_USER}`,
            to: `${email}`,
            subject: "Cambiar contraseña",
            html: `
                <h2>${user.name}, haz click en el siguiente enlace para cambiar tu contraseña: </h2>
                <a href="${process.env.LOCALHOST}/changePassword?token=${token}">cambiar contraseña </a>
                <h3>Ente enlace caducara en 15 minutos </h3>
            `
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const sendChangePassword = async(user) => {
    try {
        await transporter.sendMail({
            from: `${MAILER_USER}`,
            to: `${user.email}`,
            subject: "Actualizacion de contraseña",
            html: `
                <h2>${user.name} has actualizado tu contraseña</h2>
                <a href="${process.env.LOCALHOST}/login"> Inicia Sesion </a>
            `
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const sendCancelReservation = async(user, reservation) => {
    const token = jwt.sign({ reservationId: reservation.reservationId },process.env.JWT_SECRET_KEY,{ expiresIn: '1h' });

    try {
        await transporter.sendMail({
            from: `${MAILER_USER}`,
            to: `${user.email}`,
            subject: "Cancelar turno",
            html: `
                <h2>Hola ${user.name}</h2> 
                <p>¿Estás seguro que deseas cancelar tu <strong>${reservation.serviceName}</strong> del <strong>${reservation.date}</strong> a las <strong>${reservation.time}</strong>?</p>
                <p>Si es así, hacé clic en el botón de abajo. De lo contrario, ignorá este correo.</p>
                <a href="${process.env.LOCALHOST}/cancelReservation?token=${token}"> Cancelar </a>
                <p>Este enlace caduca en 1 hora.</p>
            `
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

