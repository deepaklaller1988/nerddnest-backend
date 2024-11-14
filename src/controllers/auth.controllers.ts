import { encryptPassword, verifyPassword } from '../utils/handlePassword';
import { Request, Response } from 'express';
import { v4 as uuid_v4 } from 'uuid';
// import { checkUserLoginAttributes } from '../types/userTypes';
import { Users } from '../db/models';
import { generateToken } from '../utils/handleToken';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

export const login = async (req: Request, res: Response) => {
    try {
        let { email, password } = await req.body;
        if (!email || !password) {
            return res.sendError(res, "ERR_MISSING_FIELDS");
        }

        if (!emailRegex.test(email)) {
            return res.sendError(res, "ERR_INVALID_EMAIL");
        }

        if (!passwordRegex.test(password)) {
            return res.sendError(res, "ERR_INVALID_PASSWORD");
        }

        let checkUser: any = await Users.findOne({
            where: {
                email
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'refreshToken']
            }
        });
        if (!checkUser) {
            return res.sendError(res, "ERR_USER_NOT_FOUND");
        }
        let isPasswordValid = await verifyPassword(password, checkUser?.password);
        if (!isPasswordValid.verified) {
            return res.sendError(res, "ERR_WRONG_PASSWORD");
        }

        let refreshToken = await generateToken(checkUser?.userId, "refreshToken");
        let accessToken = await generateToken(checkUser?.userId, "access");

        if (!refreshToken.success) {
            return res.sendError(res, "ERR_TOKEN_GENERATE_FAILED");
        }

        if (!accessToken.success) {
            return res.sendError(res, "ERR_TOKEN_GENERATE_FAILED");
        }

        checkUser.refreshToken = refreshToken.token;
        await checkUser.save();

        const cookieMaxAge = process.env.COOKIE_MAX_AGE ? parseInt(process.env.COOKIE_MAX_AGE) : 60 * 60 * 1000;
        res.cookie('accessToken', accessToken.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: cookieMaxAge,
            sameSite: 'strict'
        });

        let response = {
            userId: checkUser?.userId,
            image: checkUser?.image,
            email: checkUser?.email,
            firstName: checkUser?.firstName,
            lastName: checkUser?.lastName,
            handle: checkUser?.handle,
            dob: checkUser?.dob,
            location: checkUser?.location,
            accessToken: accessToken?.token,
        }
        return res.sendSuccess(res, response);

    } catch (err) {
        return res.sendError(res, "ERR_INTERNAL_SERVER_ERROR");
    }
}

export const register = async (req: Request, res: Response) => {
    try {
        let { image, email, password, firstname, lastname, handle, dob, location } = await req.body;
        if (!email || !password || !firstname || !lastname || !handle || !dob) {
            return res.sendError(res, "ERR_MISSING_FIELDS");
        }

        if (!emailRegex.test(email)) {
            return res.sendError(res, "ERR_INVALID_EMAIL");
        }

        if (!passwordRegex.test(password)) {
            return res.sendError(res, "ERR_INVALID_PASSWORD");
        }

        let checkUser = await Users.findOne({
            where: {
                email
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'refreshToken']
            }
        })
        if (checkUser) {
            return res.sendError(res, "ERR_ALREADY_REGISTER");
        }

        const userId = await uuid_v4();
        let refreshToken = await generateToken(userId, "refresh");
        if (!refreshToken.success) {
            return res.sendError(res, "ERR_TOKEN_GENERATE_FAILED");
        }

        let securedPassword: any = await encryptPassword(password);
        if (!securedPassword.success) {
            return res.sendError(res, "ERR_PASSWORD_ENCRYPTION_FAILED");
        }

        await Users.create({
            userId,
            image,
            email,
            password: securedPassword.password,
            firstname,
            lastname,
            handle,
            dob,
            location,
            refreshToken: refreshToken.token || "",
        })

        res.sendSuccess(res, { data: "Registration successfull" });
    } catch (err) {
        return res.sendError(res, "ERR_INTERNAL_SERVER_ERROR");
    }
}

