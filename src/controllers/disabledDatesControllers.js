import { DisabledDate } from "../models/disabledDates.js";
import { parse } from 'date-fns';

export const getDisabledDates = async (req, res) => {
    try {
        const dates = await DisabledDate.findAll({
            attributes: ['id', 'date'],
            order: [['date', 'ASC']]
        });

        return res.status(200).json(dates);
    } catch (error) {
        console.error('Error al obtener días deshabilitados:', error);
        return res.status(500).json({ message: 'Error al obtener días no laborales' });
    }
};

export const newDisabledDate = async (req, res) => {
    const { date, reason } = req.body;

    try {
        const parsedDate = parse(date, 'dd/MM/yyyy', new Date());
        const existing = await DisabledDate.findOne({ where: { date: parsedDate } });
        if (existing) {
            return res.status(409).json({ message: 'La fecha ya está deshabilitada' });
        }
        const newDate = await DisabledDate.create({
            date: parsedDate,
            reason,
        });
        return res.status(201).json({ message: 'Fecha deshabilitada creada', data: newDate });
    } catch (error) {
        console.error('Error al crear fecha deshabilitada:', error);
        return res.status(500).json({ message: 'Error al crear fecha no laboral' });
    }
};

export const deleteDisabledDate = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await DisabledDate.destroy({ where: { id } });
        if (!deleted) {
        return res.status(404).json({ message: "Fecha no encontrada" });
        }

        res.status(200).json({ message: "Fecha eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar fecha:", error);
        res.status(500).json({ message: "Error al eliminar la fecha" });
    }
};