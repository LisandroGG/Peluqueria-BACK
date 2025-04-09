import { Router } from 'express';
import { reservationsRouter } from './reservations.js';
import { usersRouter } from './users.js';
import { servicesRouter } from './services.js';
import { disabledDatesRouter } from './disabledDates.js';

export const mainRouter = Router();

mainRouter.use('/services', servicesRouter);
mainRouter.use('/reservations', reservationsRouter);
mainRouter.use('/users', usersRouter);
mainRouter.use('/disable-date', disabledDatesRouter)
