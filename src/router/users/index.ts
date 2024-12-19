
import { uploadProfilePic } from "../../controllers/users";
import { Router } from "express";

const router = Router();

router.post('/upload-profile-image', uploadProfilePic);

export default router;