import { Router } from "express";
import { login, register, users } from '../../controllers/auth';


const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/user", users);

export default router;