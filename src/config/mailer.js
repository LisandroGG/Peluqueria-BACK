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

export const sendRegisterUser = async(name, email) => {
    try {
        await transporter.sendMail({
            from: `${MAILER_USER}`,
            to: `${email}`,
            subject: "Registro en AF Peluquería",
            html: `
                <h2>Hola ${name}, gracias por registrarte en AF Peluquería</h2>
                <a href="${process.env.LOCALHOST}/login">Inicia sesion</a>
            `
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

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

export const sendCancelReservationMail = async(user, reservation) => {
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
                <a href="${process.env.LOCALHOST}/cancelReservation?token=${token}">Cancelar </a>
                <p>Este enlace caduca en 1 hora.</p>
            `
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const sendConfirmCancelReservation = async(user, reservation) => {
    try {
        await transporter.sendMail({
            from: `${MAILER_USER}`,
            to: `${user.email}`,
            subject: "Turno cancelado",
            html: `
                <h2>Hola ${user.name}</h2> 
                <p>Se ha cancelado tu turno de <strong>${reservation.serviceName}</strong> del <strong>${reservation.date}</strong> a las <strong>${reservation.time}</strong></p>
                `
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const sendNewReservation = async(name, email, serviceName, date, time) => {
    try {
        await transporter.sendMail({
            from: `${MAILER_USER}`,
            to: `${email}`,
            subject: "Turno agendado",
            html: `
                <h2>Hola ${name}</h2> 
                <p>Has agendado un turno de <strong>${serviceName}</strong> el <strong>${date}</strong> a las <strong>${time}</strong>.</p>
                `
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

