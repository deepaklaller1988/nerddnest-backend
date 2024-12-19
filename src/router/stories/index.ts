import { createStory, deleteCovers, getCovers, getStories } from "../../controllers/stories";
import { Router } from "express";

const router = Router();

router.post('/create', createStory);
router.get('/get-stories', getStories);
router.get('/get-story-covers', getCovers);
router.delete('/delete-story-covers', deleteCovers);

export default router;