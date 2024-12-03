import { acceptRequest, createConnections, deleteFriend, getFriendsList, getPendingRequests } from "../../controllers/connnections";
import { Router } from "express";

const router = Router();

// router.use(accessControl);

router.post('/send-request', createConnections);
router.put('/accept-request', acceptRequest);
router.get('/pending-requests', getPendingRequests);
router.get('/lists', getFriendsList);
router.delete('/delete', deleteFriend);


export default router;