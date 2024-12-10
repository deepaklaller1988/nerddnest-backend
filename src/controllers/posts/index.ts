import { Request, Response } from 'express';
import sequelize from '../../db/dbConnect';
import Posts from '../../db/models/posts.model';
import UserCounts from '../../db/models/user-counts.model';
import { Op } from 'sequelize';
import Connections from '../../db/models/connections.model';
import Users from '../../db/models/users.model';
import Likes from '../../db/models/likes.model';
import Comments from '../../db/models/comments.model';
import { deleteScheduleJob, editScheduledJob, postQueue, schedulePost } from '../../utils/redis/queues/posts.queue';


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

          if (data.is_scheduled) {
            const result = await schedulePost(post.id, post.user_id, data.schedule_time);
            if(result.success){
              await transaction.commit();
              return res.sendSuccess(res, post);
            }else{
              if (transaction) await transaction.rollback();
              return  res.sendError(res, result?.message);
            }
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
                { visibility: 'public' }, // Public posts visible to everyone
                { visibility: 'all-members' }, // All members can see these posts
                {
                    [Op.and]: [
                        { visibility: 'connections' }, // Connections visibility
                        {
                          [Op.or]: [
                            { user_id: userId }, // User's own posts
                            { user_id: { [Op.in]: friendIds } }, // Friend posts
                          ],
                        }
                    ],
                },
                {
                    [Op.and]: [
                        { visibility: 'only-me' }, // Only-me visibility
                        { user_id: userId }, // Only the user's own posts
                    ],
                },
            ],
              is_published: true
            },
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['id', 'firstname','lastname','handle', 'image'], // Post creator info
              }
            ],
            order: [['is_pinned', 'DESC'],['createdAt', 'DESC']], // Newest posts first
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

const pinPost = async (req: Request, res: Response) => {
  try {
    const { id, userId, pinned } = req.body;

    const post = await Posts.findOne({ where: { id, user_id: userId } });

    if (!post) {
      return  res.sendError(res, 'Post not found for this user.');
    }

    post.is_pinned = pinned;
    await post.save();

    return res.sendSuccess(res, { message: `Post ${pinned ? "pinned" : " unpinned"} successfully.` });
  } catch (error: any) {
    console.log(error)
    return  res.sendError(res, error?.message);
}
};

const changeVisibilty = async (req: Request, res: Response) => {
  try {
    const { id, userId, visibility } = req.body;

    const post = await Posts.findOne({ where: { id, user_id: userId } });

    if (!post) {
      return  res.sendError(res, 'Post not found for this user.');
    }

    post.visibility = visibility || post.visibility;
    await post.save();

    return res.sendSuccess(res, { message: 'Updated post successfully.' });
  } catch (error: any) {
    console.log(error)
    return  res.sendError(res, error?.message);
}
};

const toggleCommenting = async (req: Request, res: Response) => {
  try {
    const { id, userId, isCommentEnabled } = req.body;

    const post = await Posts.findOne({ where: { id, user_id: userId } });

    if (!post) {
      return  res.sendError(res, 'Post not found for this user.');
    }

    post.is_commenting_enabled = isCommentEnabled;
    await post.save();

    return res.sendSuccess(res, { message: `Commenting has been ${post.is_commenting_enabled ? 'enabled' : 'disabled'}.` });
  } catch (error: any) {
    console.log(error)
    return  res.sendError(res, error?.message);
}
};


const editPost = async (req: Request, res: Response) => {
  try {
    const { id, userId, content, mediaUrl, sharedLink, visibility } = req.body;

    const post = await Posts.findOne({ where: { id, user_id: userId } });

    if (!post) {
      return  res.sendError(res, 'Post not found for this user.');
    }

    post.content = content || post.content;
    post.media_url = mediaUrl || post.media_url;
    post.shared_link = sharedLink || post.shared_link;
    post.visibility = visibility || post.visibility;

    await post.save();
    return res.sendSuccess(res, post);
  } catch (error: any) {
    console.log(error)
    return  res.sendError(res, error?.message);
}
};

const editScheduledPost = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
      const { id, userId, content, mediaUrl, sharedLink, visibility, scheduleTime } = req.body;

      if (!id || !userId) {
          return res.sendError(res, "ID or User ID is missing.");
      }

      const post = await Posts.findOne({
          where: { id, user_id: userId },
      });

      if (!post) {
          return res.sendError(res, "Post not found or not owned by the user.");
      }

      // Check if the post is already published
      if (post.is_published) {
          return res.sendError(res, "Cannot edit a published post.");
      }

      const updateData: any = { content, media_url: mediaUrl,shared_link:sharedLink, visibility };

      if (scheduleTime) {
        updateData.schedule_time = scheduleTime;
        updateData.is_scheduled = true;
        updateData.is_published = false;

        const result = await editScheduledJob(post.id, post.user_id, scheduleTime);
            if(!result.success){
              if (transaction) await transaction.rollback();
              return  res.sendError(res, result?.message);
            }
      }else{
        updateData.is_scheduled = false;
        updateData.schedule_time = null;
        updateData.is_published = true;


        const result = await deleteScheduleJob(post.id, post.user_id);
          if(!result.success){
            if (transaction) await transaction.rollback();
            return  res.sendError(res, result?.message);
          }

            // Increment the user's post count
            await UserCounts.increment("no_of_posts", {
                by: 1,
                where: { user_id: userId },
                transaction,
            });
      }

      await post.update(updateData, { transaction });
      await transaction.commit();
      return res.sendSuccess(res, post);
  } catch (error: any) {
      if (transaction) await transaction.rollback();
      console.error("Error editing post:", error);
      return res.sendError(res, error.message);
  }
};



const getUserLikedPosts = async (req: Request, res: Response) => {
  const searchTerm = req.query.search || "";
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const whereCondition: any = {};
  const { userId }: any = req.query;

  try {
      if (!userId) {
          return res.sendError(res, "User Id is Missing");
      }

      if (searchTerm) {
          whereCondition[Op.or] = [
              { '$friend.firstname$': { [Op.iLike]: `%${searchTerm}%` } },
              { '$user.firstname$': { [Op.iLike]: `%${searchTerm}%` } },
          ];
      }

      const {count, rows} = await Likes.findAndCountAll({
        include: [
          {
            model: Posts,
            as: 'post',
            include:[
              {
                model: Users,
                as: 'user',
                attributes: ['id', 'firstname', 'lastname', 'handle', 'image'],
            },
            ]
        },
        ],
        where: {user_id: userId},
        order: [['createdAt', 'DESC']], // Newest posts first
        offset,
        limit: Number(limit),
      });

      let data = rows && rows.length > 0 ? rows.map((item: any) => item?.dataValues?.post) : []

      // const friendIds = await Connections.findAll({
      //     where: {
      //         [Op.or]: [
      //             { user_id: userId },
      //             { friend_id: userId }
      //         ],
      //         request_status: 'Accepted',
      //     },
      //     attributes: [
      //         sequelize.literal(`
      //             CASE 
      //             WHEN user_id = ${userId} THEN friend_id
      //             ELSE user_id
      //             END AS friendId
      //         `),
      //     ],
      //     raw: true,
      // }).then((rows: any) => rows.map((row: any) => row.friendId));

      // const { count, rows } = await Posts.findAndCountAll({
      //     where: {
      //         [Op.or]: [
      //             { visibility: 'public' },
      //             { visibility: 'all-members' },
      //             {
      //                 [Op.and]: [
      //                     { visibility: 'connections' },
      //                     {
      //                         [Op.or]: [
      //                             { user_id: userId },
      //                             { user_id: { [Op.in]: friendIds } },
      //                         ],
      //                     },
      //                 ],
      //             },
      //             {
      //                 [Op.and]: [
      //                     { visibility: 'only-me' },
      //                     { user_id: userId },
      //                 ],
      //             },
      //         ],
      //         is_published: true,
      //     },
      //     include: [
      //         {
      //             model: Users,
      //             as: 'user',
      //             attributes: ['id', 'firstname', 'lastname', 'handle', 'image'],
      //         },
      //     ],
      //     order: [['is_pinned', 'DESC'], ['createdAt', 'DESC']],
      //     offset,
      //     limit,
      // });

      let posts: any = [];

      for await (let [index, item] of data.entries()) {
          const likes = await Likes.findAll({
              where: { post_id: item?.dataValues?.id },
              attributes: ['id', 'user_id'],
              include: [
                  {
                      model: Users,
                      as: 'user',
                      attributes: ['id', 'firstname', 'lastname', 'handle', 'image'],
                  },
              ],
          });

          const comments = await Comments.findAll({
              where: { post_id: item?.dataValues?.id, parent_id: null },
              attributes: ['id', 'commenter_id', 'comment', 'createdAt'],
              include: [
                {
                  model: Users,
                  as: 'commenter',
                  attributes: ['id', 'firstname','lastname','handle', 'image'], // Post creator info
                },
                {
                  model: Comments,
                  as: 'replies', // Replies to the parent comment
                  include: [
                      {
                          model: Users,
                          as: 'commenter',
                          attributes: ['id', 'firstname', 'lastname', 'handle', 'image'], // Reply commenter info
                      },
                  ],
              },
              ],
          });

          posts.push({
              ...item.dataValues,
              likes,
              comments
          });
      }

      return res.sendPaginationSuccess(res, posts, count);
  } catch (error: any) {
      console.log(error);
      return res.sendError(res, error?.message);
  }
};


const getUserScheduledPosts = async (req: Request, res: Response) => {
  const { userId }: any = req.query;

  try {
      if (!userId) {
          return res.sendError(res, "User Id is Missing");
      }

      const posts = await Posts.findAll({
        where:{user_id: userId, is_published: false, is_scheduled: true},
        include:[
          {
            model: Users,
            as: 'user',
            attributes: ['id', 'firstname', 'lastname', 'handle', 'image'],
        },
        ]
      })

      return res.sendSuccess(res, posts);
  } catch (error: any) {
      console.log(error);
      return res.sendError(res, error?.message);
  }
};

export { createPost, getPosts, getPost, deletePost, pinPost, toggleCommenting, editPost, changeVisibilty, getUserLikedPosts, editScheduledPost, getUserScheduledPosts}