import { Router } from "express";
import { login, register, getUsers, forgotPassword, resetPassword, activateAccount, refreshAccess, resendActivationMail, logout} from '../../controllers/auth';


const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/logout", logout);
router.get("/get-users", getUsers);

router.post("/resend-activation-mail", resendActivationMail);
router.get("/verify-account", activateAccount);
router.get("/refresh-access", refreshAccess);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;