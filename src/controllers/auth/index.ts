import { encryptPassword, verifyPassword } from '../../utils/hash';
import { Request, Response } from 'express';
import { v4 as uuid_v4 } from 'uuid';
import CryptoJS from "crypto-js";
// import { checkUserLoginAttributes } from '../types/userTypes';
import { generateActivationToken, generateToken, getAccessByRefreshToken, verifyActivationToken, verifyToken } from '../../utils/handleToken';
import Users from '../../db/models/users.model';
import UserToken from '../../db/models/user-token.model';
import { sendActivationEmail, sendForgotEmail } from '../../utils/send-mailer';
import sequelize from '../../db/dbConnect';

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

        if (!checkUser.is_acc_activated) {
            return res.sendError(res, "ERR_ACCOUNT_NOT_VERIFIED");
        }


        let refreshToken = await generateToken({id:checkUser?.id, userId:checkUser?.userId}, "refresh");
        let accessToken = await generateToken({id:checkUser?.id, userId:checkUser?.userId}, "access");

        if (!refreshToken.success) {
            return res.sendError(res, "ERR_TOKEN_GENERATE_FAILED");
        }

        if (!accessToken.success) {
            return res.sendError(res, "ERR_TOKEN_GENERATE_FAILED");
        }

        checkUser.refreshToken = refreshToken.token;
        await checkUser.save();

        // const cookieMaxAge = process.env.COOKIE_MAX_AGE ? parseInt(process.env.COOKIE_MAX_AGE) : 60 * 60 * 1000;
        const cookieMaxAge = 7 * 24 * 60 * 60 * 1000; //7 days
        res.cookie('RID', refreshToken.token, {
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
            is_acc_activated: checkUser.is_acc_activated,
            accessToken: accessToken?.token,
        }
        return res.sendSuccess(res, response);

    } catch (err) {
        console.error(err)
        return res.sendError(res, "ERR_INTERNAL_SERVER_ERROR");
    }
}

export const register = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
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
        },
        { transaction }
        )

        var { token } = await generateActivationToken({id: user?.dataValues?.id, userId: user?.dataValues?.userId});

        const link = `${process.env.ADMIN_URL}/auth/registration?type=activation&token=${token}`;

        let result = await sendActivationEmail(link, user?.dataValues?.email);

        if (result === true) {
            await transaction.commit();
            return res.sendSuccess(res, { message: 'Activation email has been sent successfully' }, 200);
          } else {
            await transaction.rollback();
            return res.sendError(res, 'Error while sending activation mail');
          }

    } catch (error: any) {
        console.log(error)
        if (transaction) await transaction.rollback();
        return  res.sendError(res, error?.message);
    }
}


export const resendActivationMail = async (req: Request, res: Response) => {
    try {
        let { email, password} = await req.body;
        if (!email) {
            return res.sendError(res, "ERR_EMAIL_IS_MISSING");
        }

        let checkUser = await Users.findOne({
            where: {
                email
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'refreshToken']
            }
        });

        if (!checkUser) {
            return res.sendError(res, "User Not Found");
        }

        if (checkUser.is_acc_activated) {
            return res.sendError(res, "Account is already activated");
        }


        var { token } = await generateActivationToken({id: checkUser?.dataValues?.id, userId: checkUser?.dataValues?.userId});

        const link = `${process.env.ADMIN_URL}/auth/registration?type=activation&token=${token}`;

        let result = await sendActivationEmail(link, checkUser?.dataValues?.email);

        if (result === true) {
            return res.sendSuccess(res, { message: 'Activation email has been sent successfully' }, 200);
          } else {
            return res.sendError(res, 'Error while sending activation mail');
          }

    } catch (error: any) {
        console.log(error)
        return  res.sendError(res, error?.message);
    }
}


export const activateAccount = async (req: Request, res: Response) => {
    const { token }: any = req.query;
    try {
        if (!token) {
            return res.sendError(res, "Verification Token is Missing");
        }

        const { data, error }: any = await verifyActivationToken(token);

        if (error) {
            switch (error.name) {
              case "JsonWebTokenError":
                return res.sendError(res, "Verification Token is Invalid");
              case "TokenExpiredError":
                return res.sendError(res, "Verification Token is Expired");
              default:
                res.sendError(res, "Verification Token is Invalid");
            }
          }

          let user = await Users.findOne({
            where: {
              id: data.id
            }
          });

          if(!user){
            return res.sendError(res, "User not found");
          }

          if(user.is_acc_activated){
            return res.sendError(res, "User is already activated");
          }

        let refreshToken = await generateToken({id:user?.id, userId:user?.userId}, "refresh");
        let accessToken = await generateToken({id:user?.id, userId:user?.userId}, "access");

        if (!refreshToken.success) {
            return res.sendError(res, "ERR_TOKEN_GENERATE_FAILED");
        }

        if (!accessToken.success) {
            return res.sendError(res, "ERR_TOKEN_GENERATE_FAILED");
        }

        user.refreshToken = refreshToken.token;
        user.is_acc_activated =true;
        await user.save()
       
        // const cookieMaxAge = process.env.COOKIE_MAX_AGE ? parseInt(process.env.COOKIE_MAX_AGE) : 60 * 60 * 1000;
        const cookieMaxAge = 7 * 24 * 60 * 60 * 1000; //7 days
        res.cookie('RID', refreshToken.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: cookieMaxAge,
            sameSite: 'strict'
        });


        let response = {
            id: user?.id,
            userId: user?.userId,
            image: user?.image,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            handle: user?.handle,
            dob: user?.dob,
            location: user?.location,
            is_acc_activated: true,
            accessToken: accessToken?.token,
        }

        return res.sendSuccess(res, response);

    } catch (error: any) {
        console.log(error)
        res.sendError(res, error?.message);
      }
}


export const getUsers = async (req: Request, res: Response) => {
    try {
       
        let users = await Users.findAll();

        return res.sendSuccess(res, users, 200);
    } catch (error: any) {
        console.log(error)
        res.sendError(res, error?.message);
      }
}



const forgotPassword = async (req: Request, res: Response) => {
    try {
        const user = await Users.findOne({ where: { email: req.body.email } });
        if (!user) {
            return res.sendError(res, "ERR_AUTH_WRONG_USERNAME_OR_PASSWORD");
        }

        let resetToken = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
        let token = await UserToken.findOne({ where: { user_id: user.id } })
        if (!token) {
            await UserToken.create({ user_id: user.id, token: resetToken, createdAt: Date.now() });
        } else {
            await UserToken.update({ token: resetToken }, {
                where: {
                    id: token.id
                }
            });
        }
        const link = `${process.env.ADMIN_URL}/auth/reset-password?token=${resetToken}`;

        sendForgotEmail(link, user.email);
        return res.sendSuccess(res, { success: true, message: 'Forgot password email has been send' });
    } catch (error: any) {
        console.error(error);
        return res.sendError(res, error.message);
    }
};

const resetPassword = async (req: Request, res: Response) => {
    try {
        const userToken = await UserToken.findOne({ where: { token: req.body.token } });
        if (!userToken) {
            return res.sendError(res, "ERR_AUTH_WRONG_TOKEN");
        }
        await UserToken.destroy({ where: { id: userToken.id } });
        let securedPassword: any = await encryptPassword(req.body.password);
        if (!securedPassword.success) {
            return res.sendError(res, "ERR_PASSWORD_ENCRYPTION_FAILED");
        }

        await Users.update({
            password: securedPassword.password,
        }, {
            where: {
                id: userToken.user_id
            }
        });
        return res.sendSuccess(res, { status: true, message: 'Password changed successfully' });
    } catch (error: any) {
        console.error(error);
        return res.sendError(res, error.message);
    }
};

const refreshAccess = async (req: Request, res: Response) => {
    if(!req.cookies.RID){res.sendError(res, "ERR_AUTH_REFRESH_EXPIRED")};
    try {
        const { data, error }: any = await verifyToken(req.cookies.RID, "refresh");

        if (error) {
            switch (error.name) {
            case "JsonWebTokenError":
                return res.sendError(res, "ERR_AUTH_WRONG_REFRESH_TOKEN");
            case "TokenExpiredError":
                return res.sendError(res, "ERR_AUTH_REFRESH_EXPIRED");
            default:
                return res.sendError(res, "ERR_AUTH_WRONG_REFRESH_TOKEN");
            }
        }
        
        var tokens = await getAccessByRefreshToken(req.cookies.RID);
        if (!tokens) {
            return res.sendError(res, "ERR_AUTH_WRONG_REFRESH_TOKEN");
        } else {
            if (!tokens.success) {
                return res.sendError(res, "ERR_TOKEN_GENERATE_FAILED");
            }
            return res.sendSuccess(res, { accessToken: tokens.token }, 200);
        }
    } catch (error) {
        
    }
  };
  

export { forgotPassword, resetPassword, refreshAccess }