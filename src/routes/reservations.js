import { Router } from 'express';
import { cancelReservation, getAvailableTimes, getReservations, getReservationsByDate, getReservationsByEmail, newReservation, sendCancelEmail, updateReservationState } from '../controllers/reservationsControllers.js';
import { isAdmin } from '../middleware/authAdmin.js';
import { authUser } from '../middleware/authUser.js';
import { optionalAuthUser } from '../middleware/opcionesAuthUser.js';

export const reservationsRouter = Router();

// GET
reservationsRouter.get('/availableTimes', getAvailableTimes);

reservationsRouter.get('/getReservations', authUser, isAdmin, getReservations);
reservationsRouter.get('/getReservationsByDate', authUser, isAdmin, getReservationsByDate);
reservationsRouter.get('/getReservationsByMail', optionalAuthUser, getReservationsByEmail)

reservationsRouter.get('/cancelReservation', cancelReservation);

//POST
reservationsRouter.post('/newReservation', optionalAuthUser, newReservation);
reservationsRouter.post('/sendCancelMail', sendCancelEmail);

//PUT
reservationsRouter.put('/updateState/:reservationId', updateReservationState);
