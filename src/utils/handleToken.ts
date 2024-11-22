import Users from '../db/models/users.model';
import jwt from 'jsonwebtoken';
// import dotenv from 'dotenv';
// dotenv.config({ path: '.env' });

export const generateToken = async (payload: any, type: string) => {
    try {
        const secret = type === "refresh" ? process.env.JWT_SECRET_REFRESH : process.env.JWT_SECRET_ACCESS;
        const options = {
            expiresIn: type === "refresh" ? process.env.JWT_SECRET_REFRESH_EXP : process.env.JWT_SECRET_ACCESS_EXP
        }
        let token = await jwt.sign(payload, secret || "yJC_3M}&d=NQ$D(G52c:qY", options);
        return { token, success: true, }
    } catch (err) {
        return { error: err, success: false };
    }
}

export async function verifyToken(token: string, type: string) {
  try {
    const secret = type === "refresh" ? process.env.JWT_SECRET_REFRESH : process.env.JWT_SECRET_ACCESS;
    var r: any = await jwt.verify(token, secret || "yJC_3M}&d=NQ$D(G52c:qY");
    return { data: r, error: null };
  } catch (error) {
    return { data: null, error };
  }
}


export async function generateActivationToken(payload: any) {
    const secret = process.env.JWT_SECRET_ACTIVATION;
    var r = await jwt.sign(payload, secret || "yJC_3M}&d=NQ$D(G52c:qY");
    return { token: r, success: true };
  }

export const verifyActivationToken = async (token: string) => {
    try {
        const secret = process.env.JWT_SECRET_ACTIVATION;
        let decoded = await jwt.verify(token, secret || "yJC_3M}&d=NQ$D(G52c:qY");
        return { data: decoded, error: null };
    } catch (error) {
      return { data: null, error };
    }
}

export async function getAccessByRefreshToken(token: string) {
    /** Find user _id */
    var u = await Users.findOne({where: { refreshToken: token }});
    if (!u) return null;
  
    const res = await generateToken({id:u?.id, userId:u?.userId}, "access");
  
    /** Post processing */
    // await User.updateOne({ _id: u._id }, { $pull: { refreshTokens: token } });
    return res;
  }
  