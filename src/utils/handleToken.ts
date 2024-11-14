import jwt from 'jsonwebtoken';
// import dotenv from 'dotenv';
// dotenv.config({ path: '.env' });

export const generateToken = async (userId: string, type: string) => {
    try {
        const payload = {
            userId
        }
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

export const verifyToken = async (token: string, type: string) => {
    try {
        const secret = type === "refresh" ? process.env.JWT_SECRET_REFRESH : process.env.JWT_SECRET_ACCESS;
        let decoded = await jwt.verify(token, secret || "yJC_3M}&d=NQ$D(G52c:qY");
        return { decoded, success: true, }
    } catch (err) {
        return { error: err, success: false };
    }
}