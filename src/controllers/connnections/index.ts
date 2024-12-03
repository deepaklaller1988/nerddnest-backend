import { Request, Response } from 'express';
import sequelize from '../../db/dbConnect';
import Posts from '../../db/models/posts.model';
import UserCounts from '../../db/models/user-counts.model';
import Connections from '../../db/models/connections.model';
import { Op } from 'sequelize';
import Users from '../../db/models/users.model';

const createConnections = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        if (!req.body.userId) {
            return res.sendError(res, "User Id is Missing");
        }

        if (!req.body.friendId) {
            return res.sendError(res, "Friend Id is Missing");
        }

        const data = {
            user_id: req.body.userId,
            friend_id: req.body.friendId,
            request_status: 'Pending'
        };

        const post = await Connections.create(data, { transaction });

        await UserCounts.increment('no_of_friends', {
            by: 1,
            where: { user_id: req.body.userId },
            transaction,
          });

          await transaction.commit();
    } catch (error: any) {
        console.log(error)
        if (transaction) await transaction.rollback();
        return  res.sendError(res, error?.message);
    }
}

const getConnections = async (req: Request, res: Response) => {
    const searchTerm = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereCondition: any = {};

    try {
        if (searchTerm) {
            whereCondition[Op.or] = [
                { '$friend.firstname$': { [Op.iLike]: `%${searchTerm}%` } },
                { '$user.firstname$': { [Op.iLike]: `%${searchTerm}%` } },
            ];
        }

        if (!req.query.userId) {
            return res.sendError(res, "User Id is Missing");
        }

        let include = [
            {
                model: Users,
                as: "user"
            },
            {
                model: Users,
                as: "friend",
            }
        ];

        if (req.query.pagination === "true") {
            const { count, rows } = await Connections.findAndCountAll({
                    where: {user_id: req.query.userId}, 
                    include, 
                    order: [
                        [
                            'id', 'desc'
                        ]
                    ],
                    offset: offset,
                    limit: limit, 
                });
            return res.sendPaginationSuccess(res, rows, count);
        }else{
            const data = await Connections.findAll({
                where: {user_id: req.query.userId}, 
                include, 
                order: [
                    [
                        'id', 'desc'
                    ]
                ],
            });
            return res.sendSuccess(res, data);
        }
    } catch (error: any) {
        console.log(error)
        return  res.sendError(res, error?.message);
    }
}

export { createConnections, getConnections }