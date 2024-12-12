import { Request, Response } from 'express';
import sequelize from '../../db/dbConnect';
import Posts from '../../db/models/posts.model';
import UserCounts from '../../db/models/user-counts.model';
import Connections from '../../db/models/connections.model';
import { Sequelize, Op } from "sequelize";
import Users from '../../db/models/users.model';
import Friends from '../../db/models/friends.model';

const createConnections = async (req: Request, res: Response) => {
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

        const connect = await Connections.create(data);

          return res.sendSuccess(res, connect);
    } catch (error: any) {
        console.log(error)
        return  res.sendError(res, error?.message);
    }
}

const getPendingRequests = async (req: Request, res: Response) => {
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
                    where: {friend_id: req.query.userId, request_status: 'Pending', ...whereCondition}, 
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
                where: {friend_id: req.query.userId, request_status: 'Pending', ...whereCondition}, 
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

const acceptRequest = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        if (!req.body.id) {
            return res.sendError(res, "Id is Missing");
        }

        if (!req.body.userId) {
            return res.sendError(res, "User Id is Missing");
        }

        if (!req.body.friendId) {
            return res.sendError(res, "Friend Id is Missing");
        }


        const data = {
            request_status: req.body.status === 'Accepted' ? 'Accepted' : 'Rejected'
        };

        const connect = await Connections.update(data, { 
            where: {id: req.body.id, user_id: req.body.userId, friend_id: req.body.friendId},
            transaction 
        });

        if(req.body.status === 'Accepted'){
            await Friends.create({
                user_id: req.body.userId, friend_id: req.body.friendId
            })

            await Friends.create({
                user_id: req.body.friendId, friend_id: req.body.userId
            })

            await UserCounts.increment('no_of_friends', {
                by: 1,
                where: { user_id: req.body.userId },
                transaction,
              });

              await UserCounts.increment('no_of_friends', {
                by: 1,
                where: { user_id: req.body.friendId },
                transaction,
              });
        }

          await transaction.commit();

          return res.sendSuccess(res, connect);
    } catch (error: any) {
        console.log(error)
        if (transaction) await transaction.rollback();
        return  res.sendError(res, error?.message);
    }
}

const getFriendsList = async (req: Request, res: Response) => {
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
            const { count, rows } = await Friends.findAndCountAll({
                    where: {
                        user_id: req.query.userId,
                        ...whereCondition
                    }, 
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
            const data = await Friends.findAll({
                where: {
                    user_id: req.query.userId,
                    ...whereCondition
                }, 
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

const deleteFriend = async (req: Request, res: Response) =>{
    if (!req.body.id) {
        return res.sendError(res, 'Need Id');
    }
    try {
        const friends = await Friends.findOne({ where: { id: req.body.id } });
        if(friends){

            const del = await Friends.destroy({
                where: {
                  [Op.or]: [
                    {
                      [Op.and]: [
                        { user_id: friends?.dataValues.user_id }, // Match user_id with the logged-in user
                        { friend_id: friends?.dataValues.friend_id }, // Match friend_id with the friend's ID
                      ],
                    },
                    {
                      [Op.and]: [
                        { user_id: friends?.dataValues.friend_id }, // Match user_id with the friend's ID
                        { friend_id: friends?.dataValues.user_id }, // Match friend_id with the logged-in user
                      ],
                    },
                  ],
                },
              });

              const conDel = await Connections.destroy({
                where: {
                    [Op.or]: [
                      {
                        [Op.and]: [
                          { user_id: friends?.dataValues.user_id }, // Match user_id with the logged-in user
                          { friend_id: friends?.dataValues.friend_id }, // Match friend_id with the friend's ID
                        ],
                      },
                      {
                        [Op.and]: [
                          { user_id: friends?.dataValues.friend_id }, // Match user_id with the friend's ID
                          { friend_id: friends?.dataValues.user_id }, // Match friend_id with the logged-in user
                        ],
                      },
                    ],
                  },
              })
              
            await UserCounts.decrement('no_of_friends', {
                by: 1,
                where: { user_id: friends?.dataValues?.user_id },
              });

            await UserCounts.decrement('no_of_friends', {
                by: 1,
                where: { user_id: friends?.dataValues?.friend_id },
              });
    
            return res.sendSuccess(res, del);
        }else{
            return res.sendError(res, "Not able to delete friends");
        }

    } catch (error: any) {
        console.log(error)
        return res.sendError(res, error.message);
    }
}

const getFriendSuggestions = async (req: Request, res: Response) =>{
    const { userId } = req.query;
    try {

        // Fetch user's location
    const user = await Users.findByPk(userId, {
        attributes: ['location'],
      });
      if (!user) {
        return res.sendError(res, 'User not exists');
      }

      const userLocation = user.location;
  
    // Query mutual friends
        const mutualFriendsQuery = `
        WITH UserFriends AS (
        SELECT friend_id AS friend_id FROM friends WHERE user_id = :userId
        ),
        MutualFriends AS (
        SELECT
            u.id AS user_id,
            u.firstname,
            u.lastname,
            u.handle,
            u.image,
            u.location,
            COUNT(f2.friend_id) AS mutual_friends_count
        FROM
            friends f1
        INNER JOIN friends f2 ON f1.friend_id = f2.user_id
        INNER JOIN users u ON f2.friend_id = u.id
        WHERE
            f1.user_id = :userId
            AND u.id NOT IN (
            SELECT friend_id FROM friends WHERE user_id = :userId
            )
            AND u.id != :userId
        GROUP BY
            u.id, u.firstname, u.lastname, u.handle, u.image, u.location
        )
        SELECT * FROM MutualFriends;
        `;

        const mutualFriends = await sequelize.query(mutualFriendsQuery, {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT,
        });

        // Query users from the same location
        const locationSuggestions = await Users.findAll({
            attributes: ['id', 'firstname', 'lastname', 'handle', 'image', 'location'],
            where: {
            location: {
                [Op.iLike]: `%${userLocation}%`, // Use partial match (case-insensitive)
                },
            id: {
                [Op.notIn]: Sequelize.literal(
                `(SELECT friend_id FROM friends WHERE user_id = ${userId})`
                ),
                [Op.ne]: userId, // Exclude the user themselves
            },
            is_acc_activated: true,
            },
            raw: true,
        });

        // Combine results and avoid duplication
        const suggestionsMap = new Map();

        mutualFriends.forEach((mf: any) => {
        suggestionsMap.set(mf.user_id, { ...mf, source: 'mutual' });
        });

        locationSuggestions.forEach((ls: any) => {
        if (suggestionsMap.has(ls.id)) {
            suggestionsMap.set(ls.id, {
            ...suggestionsMap.get(ls.id),
            location: ls.location,
            source: 'mutual+location',
            });
        } else {
            suggestionsMap.set(ls.id, { ...ls, mutual_friends_count: 0, source: 'location' });
        }
    });

    // Convert Map to Array
    const suggestions = Array.from(suggestionsMap.values());
    return res.sendSuccess(res, suggestions);
        
    } catch (error: any) {
        console.log(error)
        return res.sendError(res, error.message);
    }
}


const getSearchedFriends = async (req: Request, res: Response) => {
    const searchTerm = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereCondition: any = {};

    try {
        if (searchTerm) {
            whereCondition[Op.or] = [
                { '$firstname$': { [Op.iLike]: `%${searchTerm}%` } },
                { '$lastname$': { [Op.iLike]: `%${searchTerm}%` } },
                { '$handle$': { [Op.iLike]: `%${searchTerm}%` } },
                { '$location$': { [Op.iLike]: `%${searchTerm}%` } },
                { '$email$': { [Op.iLike]: `%${searchTerm}%` } },
            ];
        }

        if (!req.query.userId) {
            return res.sendError(res, "User Id is Missing");
        }

        if (req.query.pagination === "true") {
            const { count, rows } = await Users.findAndCountAll({
                    where: {
                        id:{[Op.ne]: req.query.userId},
                        is_acc_activated: true,
                        ...whereCondition
                    }, 
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
            const data =await Users.findAll({
                where: {
                    id:{[Op.ne]: req.query.userId},
                    is_acc_activated: true,
                    ...whereCondition
                }, 
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


export { createConnections, getFriendsList, acceptRequest, getPendingRequests, deleteFriend, getFriendSuggestions, getSearchedFriends }