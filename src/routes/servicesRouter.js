import { Router } from 'express';

export const servicesRouter = Router();

// GET
servicesRouter.get('/getServices');

// POST
servicesRouter.post('/newService');

// PUT
servicesRouter.put('/editService/:id');

// DELETE
servicesRouter.delete('/deleteService/:id');