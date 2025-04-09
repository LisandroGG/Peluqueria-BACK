import { Router } from 'express';
import { getService, newService, editService, deleteService } from '../controllers/servicesControllers.js';
import { authUser } from '../middleware/authUser.js';
import { isAdmin } from '../middleware/authAdmin.js';

export const servicesRouter = Router();

// GET
servicesRouter.get('/getServices', getService);

// POST
servicesRouter.post('/newService', authUser, isAdmin, newService);

// PUT
servicesRouter.put('/editService/:id', authUser, isAdmin, editService);

// DELETE
servicesRouter.delete('/deleteService/:id', authUser, isAdmin, deleteService);