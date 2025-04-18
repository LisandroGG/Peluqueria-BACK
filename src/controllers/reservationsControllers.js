import { Reservation } from "../models/reservations.js";
import { DisabledDate } from "../models/disabledDates.js";
import { Service } from "../models/services.js"
import { User } from "../models/users.js"
import { Op } from "sequelize";
import { parse, format, isValid, isBefore, isAfter, startOfDay, setHours, setMinutes } from 'date-fns';
import { es } from "date-fns/locale";
import jwt from 'jsonwebtoken';
import { sendCancelReservationMail, sendConfirmCancelReservation, sendNewReservation } from "../config/mailer.js";

const generateTimeSlots = () => {
    const slots = [];

    const addSlots = (start, end) => {
    let [hour, minute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    while (hour < endHour || (hour === endHour && minute < endMinute)) {
        const formatted = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        slots.push(formatted);

        minute += 30;
        if (minute >= 60) {
        minute -= 60;
        hour += 1;
        }
    }
    };

    addSlots("09:30", "13:00");
    addSlots("16:00", "20:30");

    return slots;
};

export const getAvailableTimes = async (req, res) => {
  const { date } = req.query;

  try {
      if (!date) {
          return res.status(400).json({ message: "Fecha no proporcionada" });
      }

      const parsedDate = parse(date, "dd/MM/yyyy", new Date());

      if (!isValid(parsedDate)) {
          return res.status(400).json({ message: "Fecha inválida" });
      }

      const today = startOfDay(new Date());
      const requestedDate = startOfDay(parsedDate);

      // 🔒 Bloquear fechas pasadas
      if (isBefore(requestedDate, today)) {
          return res.status(400).json({ message: "No se puede consultar fechas pasadas" });
      }

      // 🕒 Si es hoy y ya pasaron todos los turnos
      if (+requestedDate === +today) {
          const now = new Date();
          const lastSlot = setHours(setMinutes(today, 30), 20); // 20:30
          if (isAfter(now, lastSlot)) {
              return res.status(200).json([]); // Ya cerró hoy
          }
      }

      const formattedDate = format(parsedDate, "yyyy-MM-dd");

      const isDisabled = await DisabledDate.findOne({ where: { date: formattedDate } });
      if (isDisabled) {
          return res.status(200).json([]);
      }

      const reservations = await Reservation.findAll({
          where: {
              reservationDate: {
                  [Op.gte]: new Date(`${formattedDate}T00:00:00`),
                  [Op.lt]: new Date(`${formattedDate}T23:59:59`)
              },
              state: 'Active'
          }
      });

      const reservedTimes = reservations.map(r => {
          const d = new Date(r.reservationDate);
          const hours = String(d.getHours()).padStart(2, "0");
          const minutes = String(d.getMinutes()).padStart(2, "0");
          return `${hours}:${minutes}`;
      });

      const allSlots = generateTimeSlots(); // Todos los turnos posibles

      // ⚠️ Si es hoy, filtramos los que ya pasaron según la hora actual
      let availableSlots = allSlots;
      if (+requestedDate === +today) {
          const now = new Date();
          availableSlots = allSlots.filter(slot => {
              const [h, m] = slot.split(":");
              const slotDate = setHours(setMinutes(new Date(), Number(m)), Number(h));
              return isAfter(slotDate, now);
          });
      }

      // Quitamos los horarios ya reservados
      const finalAvailable = availableSlots.filter(t => !reservedTimes.includes(t));

      return res.status(200).json(finalAvailable);
  } catch (error) {
      console.error("Error al obtener horarios disponibles:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const newReservation = async (req, res) => {
    const { date, time, serviceId, clientName, email, phoneNumber } = req.body;
    let finalName = clientName;
    let finalEmail = email;
    let finalPhone = phoneNumber;
    let userId = null;

    try {
        if (req.user && req.user.userId) {
        const user = await User.findByPk(req.user.userId);
        if (user) {
            finalName = user.name;
            finalEmail = user.email;
            finalPhone = user.phoneNumber;
            userId = user.userId;
        }
    }

    if (!date || !time || !finalName || !finalEmail || !finalPhone || !serviceId) {
        return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const parsedDate = parse(`${date} ${time}`, "dd/MM/yyyy HH:mm", new Date());

    if (!isValid(parsedDate)) {
        return res.status(400).json({ message: "Fecha u hora inválida" });
    }

    const existingReservation = await Reservation.findOne({
        where: {
            reservationDate: parsedDate
        }
    });

    if (existingReservation) {
        return res.status(409).json({ message: "Ya hay una reserva para ese horario" });
    }

    const service = await Service.findByPk(serviceId);
        if (!service) {
        return res.status(400).json({ message: "Servicio no válido" });
    }

    const formattedDate = format(parsedDate, "yyyy-MM-dd");
    const isDisabled = await DisabledDate.findOne({ where: { date: formattedDate } });

    if (isDisabled) {
        return res.status(400).json({ message: "No se puede reservar en un día no laboral" });
    }

    const reservation = await Reservation.create({
        reservationDate: parsedDate,
        clientName: finalName,
        email: finalEmail,
        phoneNumber: finalPhone,
        serviceId,
        userId,
    });

    const formattedTime = format(parsedDate, "HH:mm");
    const mailSent = await sendNewReservation(
      finalName,
      finalEmail,
      service.serviceName,
      date,
      formattedTime
    );

    if (mailSent) {
      return res.status(200).json({ message: "Reserva creada correctamente" });
    }

    } catch (error) {
        console.error("Error al crear reserva:", error);
        return res.status(500).json({ message: "Error al crear la reserva" });
    }
};

export const getReservations = async (req, res) => {
    try {
        const reservations = await Reservation.findAll({
            where: { state: "Active" },
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['name', 'email', 'phoneNumber'],
              },
              {
                model: Service,
                as: 'service',
                attributes: ['serviceName'],
              }
            ],
            order: [['reservationDate', 'ASC']]
          });

      const formatted = reservations.map(r => ({
        reservationId: r.reservationId,
        clientName: r.clientName,
        email: r.email,
        phoneNumber: r.phoneNumber,
        date: format(r.reservationDate, 'dd/MM/yyyy', { locale: es }),
        time: format(r.reservationDate, 'HH:mm'),
        service: r.service ? r.service.serviceName : null,
        state: r.state,
      }));

      return res.status(200).json(formatted);
    } catch (error) {
      console.error('Error al obtener reservas:', error);
      return res.status(500).json({ message: 'Error al obtener reservas' });
    }
  };

export const getReservationsByDate = async (req, res) => {
    const { date } = req.query; 
  
    if (!date) {
      return res.status(400).json({ message: "Fecha no proporcionada" });
    }
  
    const parsedDate = parse(date, "dd/MM/yyyy", new Date());
    if (!isValid(parsedDate)) {
      return res.status(400).json({ message: "Fecha inválida" });
    }
  
    const start = new Date(parsedDate.setHours(0, 0, 0, 0));
    const end = new Date(parsedDate.setHours(23, 59, 59, 999));
  
    try {
      const reservations = await Reservation.findAll({
        where: {
            reservationDate: {
              [Op.between]: [start, end]
            },
            state: "Active"
          },
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ["serviceName"]
          },
          {
            model: User,
            as: 'user',
            attributes: ["name", "email", "phoneNumber"]
          }
        ],
        order: [["reservationDate", "ASC"]]
      });

    const formatted = reservations.map(r => ({
      reservationId: r.reservationId,
      clientName: r.clientName,
      email: r.email,
      phoneNumber: r.phoneNumber,
      date: format(r.reservationDate, "dd/MM/yyyy", { locale: es }),
      time: format(r.reservationDate, "HH:mm"),
      service: r.service?.serviceName || null,
      state: r.state
    }));
  
    return res.status(200).json(formatted);
    } catch (error) {
      console.error("Error al obtener reservas por fecha:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const updateReservationState = async (req, res) => {
    const { reservationId } = req.params;

    try {
      const reservation = await Reservation.findByPk(reservationId);

      if (!reservation) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }

      reservation.state = "Finish";
      await reservation.save();

      return res.status(200).json({ message: "Estado actualizado correctamente", reservation });
    } catch (error) {
      console.error("Error al actualizar el estado de la reserva:", error);
      return res.status(500).json({ message: "Error al actualizar estado" });
    }
};


export const sendCancelEmail = async (req, res) => {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({ message: "Falta el ID de la reserva" });
    }
  
    try {
        const reservation = await Reservation.findByPk(reservationId, {
            include: [
                { model: Service, as: "service" }
            ]
          });
  
      if (!reservation) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }

      let user = {
        name: reservation.clientName,
        email: reservation.email
      };

      if (reservation.userId) {
        const foundUser = await User.findByPk(reservation.userId);
        if (foundUser) {
          user = {
            name: foundUser.name,
            email: foundUser.email
          };
        }
      }

      const formattedDate = format(reservation.reservationDate, 'dd/MM/yyyy');
      const formattedTime = format(reservation.reservationDate, 'HH:mm');

      const mailSent = await sendCancelReservationMail(user, {
        reservationId: reservation.reservationId,
        date: formattedDate,
        time: formattedTime,
        serviceName: reservation.service?.serviceName
      });

      if (mailSent) {
        return res.status(200).json({ message: "Correo de cancelación enviado" });
      } else {
        return res.status(500).json({ message: "Error al enviar el correo" });
      }
    } catch (error) {
      console.error("Error al enviar correo de cancelación:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const cancelReservation = async (req, res) => {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token no proporcionado" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const reservationId = decoded.reservationId;

      const reservation = await Reservation.findByPk(reservationId, {
        include: [
            { model: Service, as: "service" }
        ]
      });

      if (!reservation) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }

      if (reservation.state === "Finish") {
        return res.status(400).json({ message: "Esta reserva ya finalizó" });
      }

      let user = {
        name: reservation.clientName,
        email: reservation.email
      };

      if (reservation.userId) {
        const foundUser = await User.findByPk(reservation.userId);
        if (foundUser) {
          user = {
            name: foundUser.name,
            email: foundUser.email
          };
        }
      }

      const formattedDate = format(reservation.reservationDate, 'dd/MM/yyyy');
      const formattedTime = format(reservation.reservationDate, 'HH:mm');

      await reservation.destroy();

      const mailSent = await sendConfirmCancelReservation(user, {
        date: formattedDate,
        time: formattedTime,
        serviceName: reservation.service?.serviceName
      })

      if(mailSent === false){
        return res.status(400).json({ message: "Error enviar el correo"})
      }

      return res.status(200).json({ message: "Reserva cancelada y eliminada correctamente" });
    } catch (error) {
      console.error("Error al cancelar con token:", error);
      return res.status(401).json({ message: "Token inválido o expirado" });
    }
};

export const getReservationsByEmail = async (req, res) => {
    let emailFromRequest = req.query.email;

    if (req.user && req.user.email) {
      emailFromRequest = req.user.email;
    }
  
    if (!emailFromRequest) {
      return res.status(400).json({ message: "Falta el email" });
    }

    try {
      const reservations = await Reservation.findAll({
        where: { email: emailFromRequest },
        include: [
          { model: Service, as: "service" }
        ],
        order: [["reservationDate", "ASC"]]
      });

      if (reservations.length === 0) {
        return res.status(404).json({ message: "No tienes reservas disponibles" });
      }

      const formatted = reservations.map(r => ({
        reservationId: r.reservationId,
        clientName: r.clientName,
        email: r.email,
        phoneNumber: r.phoneNumber,
        date: format(r.reservationDate, "dd/MM/yyyy", { locale: es }),
        time: format(r.reservationDate, "HH:mm"),
        service: r.service?.serviceName || null,
      }));

      return res.status(200).json(formatted);
    } catch (error) {
      console.error("Error al obtener reservas por email:", error);
      return res.status(500).json({ message: "Error al buscar reservas" });
    }
};