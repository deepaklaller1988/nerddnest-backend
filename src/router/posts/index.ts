import { createPost, deletePost, getPost, getPosts } from "../../controllers/posts";
import { Router } from "express";

const router = Router();

// router.use(accessControl);

router.post('/create', createPost);
router.get('/fetch', getPosts);
router.get('/fetch-by-id', getPost);
router.delete('/delete', deletePost);


export default router;