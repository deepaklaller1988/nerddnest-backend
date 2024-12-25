import { getConversations, getMessages } from "../../controllers/messages";
import { Router } from "express";

const router = Router();

router.get("/get-messages", getMessages);
router.get("/get-conversations", getConversations);

export default router;