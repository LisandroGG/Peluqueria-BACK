import { Router } from 'express';
import { changePassword, forgotPassword, loginUser, logoutUser, registerUser } from '../controllers/usersControllers.js';

export const usersRouter = Router();

//GET
//usersRouter.get('/');

//POST
usersRouter.post('/register', registerUser);
usersRouter.post('/login', loginUser);
usersRouter.post('/logout', logoutUser);
usersRouter.post('/forgotPassword', forgotPassword);

//PUT
usersRouter.put('/changePassword', changePassword);