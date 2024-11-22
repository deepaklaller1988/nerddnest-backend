import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/handleToken";

interface AuthenticatedRequest extends Request {
    user?: any;
  }

const accessControl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // const authToken = req.header("authorization")?.replace("Bearer ", "");
  let authToken = req.header("authorization") || "";

  if (authToken.startsWith("Bearer ")) {
    authToken = authToken.replace("Bearer ", "");
  }

  if (!authToken) {
    return res.status(401).json({
      error: {
        code: "ERR_ACCESS_TOKEN_MISSING",
        message: "Authorization-Header is not set",
      },
    });
  }
  const { data, error }: any = await verifyToken(authToken, "access");
  if (error) {
    switch (error.name) {
      case "JsonWebTokenError":
        return res
          .status(403)
          .json({ error: { code: "ERR_INVALID_ACCESS_TOKEN" } });
      case "TokenExpiredError":
        return res
          .status(403)
          .json({ error: { code: "ERR_ACCESS_TOKEN_EXPIRED" } });
      default:
        return res
          .status(403)
          .json({ error: { code: "ERR_INVALID_ACCESS_TOKEN" } });
    }
  }
  req.user = data;
  next();
};

export default accessControl;