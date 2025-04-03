import { Router } from 'express';
import { servicesRouter } from './servicesRouter.js';
import { reservationsRouter } from './reservations.js';
import { usersRouter } from './users.js';

export const mainRouter = Router();

mainRouter.use('/services', servicesRouter);
mainRouter.use('/reservations', reservationsRouter);
mainRouter.use('users', usersRouter);
