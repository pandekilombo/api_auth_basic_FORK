import { Router } from 'express';
import AuthService from '../services/AuthService.js';
import UserService from '../services/UserService.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', AuthMiddleware.validateUserAndPass, async (req, res) => {
    const response = await AuthService.login(req.body.email, req.body.password);
    res.status(response.code).json(response.message);
});

router.post('/register', async (req, res) => {
    const response = await UserService.createUser(req);
    res.status(response.code).json(response.message);
});

router.post('/logout', AuthMiddleware.validateToken, async (req, res) => {
    const response = await AuthService.logout(req.headers.token);
    res.status(response.code).json(response.message);
});



export default router;