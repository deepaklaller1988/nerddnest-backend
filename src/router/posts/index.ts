import { deleteComment, getComments, postComment, postReplyComment } from "../../controllers/comments";
import { getLikes, likePost } from "../../controllers/likes";
import { changeVisibilty, createPost, deletePost, editPost, getPost, getPosts, pinPost, toggleCommenting } from "../../controllers/posts";
import { Router } from "express";

const router = Router();

// router.use(accessControl);

router.post('/create', createPost);
router.get('/fetch', getPosts);
router.get('/fetch-by-id', getPost);
router.delete('/delete', deletePost);

router.put('/change-visibility', changeVisibilty);
router.put('/turn-off-comments', toggleCommenting);
router.put('/pin-post', pinPost);
router.put('/update', editPost);

router.post('/like', likePost);
router.get('/get-likes', getLikes);

router.post('/comment', postComment);
router.post('/reply-comment', postReplyComment);
router.get('/get-comments', getComments);
router.delete('/delete-comment', deleteComment);

export default router;