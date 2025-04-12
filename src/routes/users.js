import { Router } from 'express';
import { changePassword, forgotPassword, loginUser, logoutUser, registerUser, refreshAccessToken, getMe } from '../controllers/usersControllers.js';

export const usersRouter = Router();

//GET
usersRouter.get('/me', getMe)

//POST
usersRouter.post('/register', registerUser);
usersRouter.post('/login', loginUser);
usersRouter.post('/logout', logoutUser);
usersRouter.post('/forgotPassword', forgotPassword);
usersRouter.post("/refresh", refreshAccessToken);

//PUT
usersRouter.put('/changePassword', changePassword);