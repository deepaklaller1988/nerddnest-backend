import { Router } from "express";
import { login, register, getUsers, forgotPassword, resetPassword} from '../../controllers/auth';


const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/get-users", getUsers);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;