
import { onlineUsersConnections, uploadProfilePic } from "../../controllers/users";
import { Router } from "express";

const router = Router();

router.post('/upload-profile-image', uploadProfilePic);
router.get('/get-online-users', onlineUsersConnections);

export default router;