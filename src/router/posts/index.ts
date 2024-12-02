import { createPost } from "../../controllers/posts";
import { Router } from "express";

const router = Router();

// router.use(accessControl);

router.post('/create', createPost);


export default router;