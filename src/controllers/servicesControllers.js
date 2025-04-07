import { Service } from "../models/services.js";

export const getService = async(req, res) => {
    try {
        const services = await Service.findAll()

        if(services.length === 0) {
            return res.status(404).json({ message: "No hay servicios disponibles"})
        }

        return res.status(200).json(services)
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const newService = async(req, res) => {
    const { serviceName, serviceCost } = req.body;

    if (!serviceName || !serviceCost) {
        return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    try {
        const newService = await Service.create({ serviceName, serviceCost });

        return res.status(201).json({ 
            message: "Servicio creado correctamente", 
            service: newService 
        });
    } catch (error) {
        console.error("Error al crear el servicio:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const editService = async(req, res) => {
    const { id } = req.params;
    const { serviceCost, serviceName } = req.body;

    if (!serviceCost && !serviceName) {
        return res.status(400).json({ message: "Debes proporcionar al menos un dato a modificar" });
    }

    if (serviceCost && (isNaN(serviceCost) || Number(serviceCost) <= 0)) {
        return res.status(400).json({ message: "El costo del servicio debe ser un número válido mayor a 0" });
    }

    try {

        const service = await Service.findByPk(id);

        if(!service) {
            res.status(404).json({ message: "Servicio no encontrado"});
        }

        if (serviceCost !== undefined) service.serviceCost = serviceCost;
        if (serviceName !== undefined) service.serviceName = serviceName;

        await service.save();

        return res.status(200).json({
            message: "Servicio actualizado correctamente",
            service
        });
        
    } catch (error) {
        console.error("Error al editar servicio:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const deleteService = async(req, res) => {
    const { id } = req.params;

    try {
        const service = await Service.findByPk(id);

        if(!service) {
            res.status(404).json({ message: "Servicio no encontrado"});
        }

        await service.destroy()

        return res.status(200).json({ message: "Servicio eliminado correctamente"});

    } catch (error) {
        console.error("Error al eliminar servicio:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};