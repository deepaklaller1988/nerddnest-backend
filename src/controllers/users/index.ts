import { Request, Response } from 'express';
import sequelize from '../../db/dbConnect';
import { Op } from 'sequelize';
import Users from '../../db/models/users.model';

const uploadProfilePic = async (req:Request,res:Response) =>{
    const { userId, profileUrl }: any = req.body;
    try {

        if (!userId) {
            return res.sendError(res, "User Id is Missing");
        }

        const user = await Users.findOne({
            where: { id: userId },
        });
  
        if (!user) {
            return res.sendError(res, "User not found");
        }

        user.image = profileUrl
        await user.save();

        return res.sendSuccess(res, user);
     } catch (error: any) {
    console.log(error)
    return  res.sendError(res, error?.message);
    }
}

export {uploadProfilePic}