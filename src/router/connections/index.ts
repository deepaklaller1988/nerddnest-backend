import { acceptRequest, createConnections, deleteFriend, getFriendsList, getFriendSuggestions, getPendingRequests, getSearchedFriends } from "../../controllers/connnections";
import { Router } from "express";

const router = Router();

// router.use(accessControl);

router.post('/send-request', createConnections);
router.put('/accept-request', acceptRequest);
router.get('/pending-requests', getPendingRequests);
router.get('/lists', getFriendsList);
router.get('/suggestions', getFriendSuggestions);
router.get('/search', getSearchedFriends);
router.delete('/delete', deleteFriend);


export default router;