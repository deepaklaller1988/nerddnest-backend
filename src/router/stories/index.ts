import { createStory, getStories } from "../../controllers/stories";
import { Router } from "express";

const router = Router();

router.post('/create', createStory);
router.get('/get-stories', getStories);

export default router;