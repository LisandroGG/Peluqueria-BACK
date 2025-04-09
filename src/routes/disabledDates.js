import { Router } from 'express';
import { newDisabledDate, getDisabledDates, deleteDisabledDate } from '../controllers/disabledDatesControllers.js';
import { authUser } from '../middleware/authUser.js';
import { isAdmin } from '../middleware/authAdmin.js';

export const disabledDatesRouter = Router();

// GET
disabledDatesRouter.get('/getDisabledDates', getDisabledDates);

// POST
disabledDatesRouter.post('/newDisabledDate', authUser, isAdmin, newDisabledDate);

// DELETE
disabledDatesRouter.delete('/deleteDisabledDate/:id', authUser, isAdmin, deleteDisabledDate)

