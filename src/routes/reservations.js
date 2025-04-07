import { Router } from 'express';

export const reservationsRouter = Router();

//GET
reservationsRouter.get('/getReservations');

//POST
reservationsRouter.post('/newReservation');

//PUT
reservationsRouter.put('/editReservation/:id');

//DELETE
reservationsRouter.delete('/deleteReservations/:id');