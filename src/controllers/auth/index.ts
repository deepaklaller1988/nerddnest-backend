import { encryptPassword, verifyPassword } from '../../utils/hash';
import { Request, Response } from 'express';
import { v4 as uuid_v4 } from 'uuid';
// import { checkUserLoginAttributes } from '../types/userTypes';
import { generateToken } from '../../utils/handleToken';
import Users from '../../db/models/users.model';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

export const login = async (req: Request, res: Response) => {
    console.log("object")
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

        let refreshToken = await generateToken({id:checkUser?.id, userId:checkUser?.userId}, "refreshToken");
        let accessToken = await generateToken({id:checkUser?.id, userId:checkUser?.userId}, "access");

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
            id: checkUser?.id,
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
            return res.sendError(res, "ERR_EMAIL_ALREADY_EXIST");
        }

        const userId = await uuid_v4();
        let securedPassword: any = await encryptPassword(password);
        if (!securedPassword.success) {
            return res.sendError(res, "ERR_PASSWORD_ENCRYPTION_FAILED");
        }

        const user = await Users.create({
            userId,
            image,
            email,
            password: securedPassword.password,
            firstname,
            lastname,
            handle,
            dob,
            location
        })
        var { token } = await generateToken({id: user?.dataValues?.id, userId: user?.dataValues?.userId}, "refresh");
        return res.sendSuccess(res, { token }, 200);
    } catch (error: any) {
        console.log(error)
        res.sendError(res, error?.message);
      }
}


export const users = async (req: Request, res: Response) => {
    try {
       
        let checkUser = await Users.findAll();

        return res.sendSuccess(res, { checkUser }, 200);
    } catch (error: any) {
        console.log(error)
        res.sendError(res, error?.message);
      }
}
