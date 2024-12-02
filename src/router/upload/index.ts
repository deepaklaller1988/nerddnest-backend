import {
    download,
    upload,
    viewFile
} from "../../controllers/upload";
// import accessControl from "../../middleware/access-control";
import uploadMiddleware from "../../middlewares/upload";
import { Router } from "express";

const router = Router();

// router.use(accessControl);

// file Routes
router.get('/:name', viewFile);
router.post('/upload',uploadMiddleware.single('file'), upload);


export default router;