import { Router } from "express";
import { login, register, getUsers, forgotPassword, resetPassword, activateAccount, refreshAccess, resendActivationMail, logout} from '../../controllers/auth';
import accessControl from "../../middlewares/access-control";

const router = Router();

router.post("/login", login);
router.post("/register", register);

router.post("/resend-activation-mail", resendActivationMail);
router.get("/verify-account", activateAccount);
router.get("/logout", logout);
router.get("/refresh-access", refreshAccess);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.use(accessControl)

router.get("/get-users", getUsers);

export default router;