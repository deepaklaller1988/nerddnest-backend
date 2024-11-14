import express from 'express';
import { login, register } from '../controllers/auth.controllers';

const router = express();

router.route("/login").post(login);
router.route("/register").post(register);

export default router;