import jwt from "jsonwebtoken";
import { User } from "../models/users.js";
import { comparePassword, hashPassword } from "../helpers/password.js";
import { sendChangePassword, sendForgotPassword, sendRegisterUser } from "../config/mailer.js";

const regexEmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
const regexPhone = /^\+?\d{10,15}$/;

export const registerUser = async(req, res) => {
    const { name, email, phoneNumber, password } = req.body

    try {
        if (!name || !email || !phoneNumber || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }

        if (!regexEmail.test(email)) {
            return res.status(400).json({ message: 'El correo electrónico debe ser un Gmail válido.' });
        }

        if (!regexPhone.test(phoneNumber)) {
            return res.status(400).json({ message: 'El número de teléfono no es válido. Debe tener entre 10 y 15 dígitos y puede comenzar con +.' });
        }

        if (!regexPassword.test(password)) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.' });
        }

        const newUser = await User.create({
            name,
            email,
            phoneNumber,
            password,
            role: "user"
        });

        const sentMail = await sendRegisterUser(name, email)
        if(sentMail === false){
            return res.status(400).json({ message: "Error enviar el correo"})
        }
        
        return res.status(201).json({message: "Usuario creado Correctamente", 
            user: {
                id: newUser.userId,
                name: newUser.name,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                role: newUser.role,
            }
        });

    } catch (error) {
        console.log("Error al registrar usuario")
        res.status(404).json({ message: "Error al crear el usuario"})
    }
};

export const loginUser = async(req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
        }

        const validPassword = await comparePassword(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            {
                userId: user.userId,
                role: user.role,
                email: user.email,
            },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "2h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "Lax",
            });

        return res.status(200).json({
            message: "Login exitoso",
            token,
            user: {
                userId: user.userId,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error en login:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const logoutUser = async(req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "Lax"
        });
        res.status(200).json({ message: "Sesion cerrada exitosamente" });
    } catch (error) {
        console.error("Error en logout:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const forgotPassword = async(req, res) => {
    const { email } = req.body;

    if (!regexEmail.test(email)) {
        return res.status(400).json({ message: 'El correo electrónico debe ser un Gmail válido.' });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if(!user) return res.status(404).json({ message: "Usuario no encontrado"})

        const sentEmail = await sendForgotPassword(user, email);

        if(sentEmail === false){
            return res.status(400).json({ message: "Error enviar el correo de recuperacion"})
        }

        return res.status(200).json({ message: "Se envio un correo de restablecer contraseña"})
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error al enviar mail de recuperacion (server)"})
    }
};

export const changePassword = async(req,res) => {
    const { token } = req.query;
    const { newPassword } = req.body;

    if(!newPassword){
        return res.status(400).json({ message: 'Ingrese una contraseña para cambiar'})
    }

    if (!regexPassword.test(newPassword)) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        const user = await User.findByPk(decoded.userId);
        if(!user) return res.status(404).json({ message: "Usuario no encontrado"})

        user.password = await hashPassword(newPassword)

        await user.save()

        const sentEmail = await sendChangePassword(user);

        if(sentEmail === false){
            return res.status(400).json({ message: "Error enviar el correo"})
        }

        return res.status(200).json({ message: "Contraseña actualizada correctamente"})
    } catch (error) {
        return res.status(400).json({ message: "Token invalido o expirado"})
    }
};

