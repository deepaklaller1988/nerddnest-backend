import { acceptRequest, cancelFriendRequest, createConnections, deleteFriend, getFriendProfile, getFriendsList, getFriendSuggestions, getPendingRequests, getSearchedFriends } from "../../controllers/connnections";
import { Router } from "express";

const router = Router();

// router.use(accessControl);

router.post('/send-request', createConnections);
router.put('/accept-request', acceptRequest);
router.get('/pending-requests', getPendingRequests);
router.get('/lists', getFriendsList);
router.get('/suggestions', getFriendSuggestions);
router.get('/search', getSearchedFriends);
router.get('/friend-profile', getFriendProfile);
router.delete('/delete', deleteFriend);
router.delete('/cancel-request', cancelFriendRequest);


export default router;