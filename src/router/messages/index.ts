import { getMessages } from "../../controllers/messages";
import { Router } from "express";

const router = Router();

router.get("/get-messages", getMessages);

export default router;