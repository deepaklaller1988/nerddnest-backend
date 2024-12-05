import { Request, Response } from 'express';
import sequelize from '../../db/dbConnect';
import Posts from '../../db/models/posts.model';
import UserCounts from '../../db/models/user-counts.model';
import { Op } from 'sequelize';
import Connections from '../../db/models/connections.model';
import Users from '../../db/models/users.model';
import Likes from '../../db/models/likes.model';
import Comments from '../../db/models/comments.model';


const createPost = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {

        if (!req.body.userId) {
            return res.sendError(res, "User Id is Missing");
        }

        const data: any = {
            user_id: req.body.userId,
            post_type: req.body.postType,
            content: req.body.content,
            media_url: req.body.mediaUrl,
            shared_link: req.body.sharedLink,
            visibility: req.body.visibility ?  req.body.visibility : 'public'
        };


        if (req.body.scheduleTime) {
          data.schedule_time = req.body.scheduleTime; // Parse the schedule time
          data.is_scheduled = true;
          data.is_published = false;
        } else {
          data.is_published = true; // Immediate post
        }
    

        const post = await Posts.create(data, { transaction });

          if (!data.is_scheduled) {
            await UserCounts.increment("no_of_posts", {
              by: 1,
              where: { user_id: req.body.userId },
              transaction,
            });
          }
      

          await transaction.commit();
          return res.sendSuccess(res, post);
    } catch (error: any) {
        console.log(error)
        if (transaction) await transaction.rollback();
        return  res.sendError(res, error?.message);
    }
}


const getPosts = async (req: Request, res: Response) => {
    const searchTerm = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereCondition: any = {};
    const { userId }: any = req.query;

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

        const friendIds = await Connections.findAll({
            where: { 
              [Op.or]: [
                { user_id: userId },
                { friend_id: userId }
              ],
              request_status: 'Accepted', // Assuming "accepted" means they are friends
            },
            attributes: [
              sequelize.literal(`
                CASE 
                WHEN user_id = ${userId} THEN friend_id
                ELSE user_id
                END AS friendId
              `),
            ],
            raw: true,
          }).then((rows: any) => rows.map((row: any) => row.friendId));

          const { count, rows } = await Posts.findAndCountAll({
            where: {
              [Op.or]: [
                { user_id: userId }, // User's own posts
                { user_id: { [Op.in]: friendIds } }, // Friend posts
                // { privacy: 'public' }, // Public posts
              ],
            },
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['id', 'firstname','lastname','handle', 'image'], // Post creator info
              }
            ],
            order: [['createdAt', 'DESC']], // Newest posts first
            offset,
            limit: Number(limit),
          });

          let posts:any = [];

          for await (let [index, item] of rows.entries()) {
            const likes = await Likes.findAll({
                where: {post_id: item?.dataValues?.id},
                attributes: ['id', 'user_id'], 
                include: [
                    {
                      model: Users,
                      as: 'user',
                      attributes: ['id', 'firstname','lastname','handle', 'image'], // Commenter info
                    },
                  ],
            })

            const comments = await Comments.findAll({
                where: {post_id: item?.dataValues?.id},
                attributes: ['id', 'commenter_id', 'comment', 'createdAt'], // Comments on the post
                include: [
                  {
                    model: Users,
                    as: 'commenter',
                    attributes: ['id', 'firstname','lastname','handle', 'image'], // Commenter info
                  },
                ],
            });

            posts.push({
                ...item.dataValues,
                likes,
                comments
            })
          }

          return res.sendPaginationSuccess(res, posts,count);
    } catch (error: any) {
        console.log(error)
        return  res.sendError(res, error?.message);
    }
}

const getPost = async (req: Request, res: Response) => {
    const { id }: any = req.query;

    try {
        if (!id) {
            return res.sendError(res, "Post Id is Missing");
        }


          const post = await Posts.findOne({
            where: {
                id
            },
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['id', 'firstname','lastname','handle', 'image'], // Post creator info
              }
            ]
          });

          let likes:any = [];
          let comments:any = [];

            if(post && post?.dataValues?.id){
                likes = await Likes.findAll({
                    where: {post_id: post?.dataValues?.id},
                    attributes: ['id', 'user_id'], 
                    include: [
                        {
                          model: Users,
                          as: 'user',
                          attributes: ['id', 'firstname','lastname','handle', 'image'], // Commenter info
                        },
                      ],
                })

                comments = await Comments.findAll({
                    where: {post_id: post?.dataValues?.id},
                    attributes: ['id', 'commenter_id', 'comment', 'createdAt'], // Comments on the post
                    include: [
                      {
                        model: Users,
                        as: 'commenter',
                        attributes: ['id', 'firstname','lastname','handle', 'image'], // Commenter info
                      },
                    ],
                });
            }


            let data = {
                ...post.dataValues,
                likes,
                comments
            }

          return res.sendSuccess(res, data);
    } catch (error: any) {
        console.log(error)
        return  res.sendError(res, error?.message);
    }
}


const deletePost = async (req: Request, res: Response) =>{
    if (!req.body.id) {
        return res.sendError(res, 'Need Post Id');
    }
    try {
        const post = await Posts.findOne({ where: { id: req.body.id } });
        const del = await Posts.destroy({
            where: {
                id: req.body.id
            }
        });

        await UserCounts.decrement('no_of_posts', {
            by: 1,
            where: { user_id: post?.dataValues?.user_id },
          });

        return res.sendSuccess(res, del);

    } catch (error: any) {
        console.log(error)
        return res.sendError(res, error.message);
    }
}

export { createPost, getPosts, getPost, deletePost}