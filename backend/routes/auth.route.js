import express from 'express';
import { login, logout, signup, refreshToken } from '../controllers/auth.controller.js';

const router = express.Router();

// router.get('/', (req, res) => {
//   res.send('Auth route is working fine');
// });

router.post('/signup', signup );

router.post('/login', login );

router.post('/logout', logout);

router.post('/refresh-token', refreshToken);

// router.get('/profile', getProfile);

export default router;