import { Request, Response } from 'express';
import sequelize from '../../db/dbConnect';
import { Op } from 'sequelize';
import Users from '../../db/models/users.model';
import Friends from '../../db/models/friends.model';

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

const onlineUsersConnections = async (req:Request,res:Response) =>{
    const { userId, profileUrl }: any = req.query;
    const searchTerm = req.query.search || "";
    const whereCondition: any = {};

    try {
        if (searchTerm) {
            whereCondition[Op.or] = [
                { '$friend.firstname$': { [Op.iLike]: `%${searchTerm}%` } },
                { '$user.firstname$': { [Op.iLike]: `%${searchTerm}%` } },
            ];
        }
        if (!userId) {
            return res.sendError(res, "User Id is Missing");
        }

        let include = [
            {
                model: Users,
                as: "user",
                attributes: ['id', 'firstname', 'lastname', 'handle', 'image'],
            },
            {
                model: Users,
                as: "friend",
                attributes: ['id', 'firstname', 'lastname', 'handle', 'email', 'image', 'online_status'],
            }
        ];

        const rows = await Friends.findAll({
            where: {
                user_id: userId,
                '$friend.online_status$': true,
                ...whereCondition
            }, 
            include, 
            order: [
                [
                    'id', 'desc'
                ]
            ],
        });

        let data= [];

        for await (let row of rows){
            data.push({
                ...row?.friend?.dataValues
            })
        }

        return res.sendSuccess(res, data);
     } catch (error: any) {
    console.log(error)
    return  res.sendError(res, error?.message);
    }
}
export {uploadProfilePic, onlineUsersConnections}