import util from "util";
import multer from "multer";

let uploadFileMiddleware = multer({ storage: multer.memoryStorage() });
export default uploadFileMiddleware;