import { Request, Response } from 'express';
import sequelize from '../../db/dbConnect';
import { Op } from 'sequelize';
import Posts from '../../db/models/posts.model';
import Users from '../../db/models/users.model';
import Likes from '../../db/models/likes.model';

export const likePost = async (req: Request, res: Response) =>{
    try {
        const { postId, userId } = req.body;

        const post = await Posts.findOne({ where: { id: postId } });

        if (!post) {
          return  res.sendError(res, 'Post not found.');
        }

        const existingLike = await Likes.findOne({ where: { user_id: userId, post_id: postId } });

        if (existingLike) {
            await existingLike.destroy();
            await Posts.increment('likes_count', { by: -1, where: { id: postId } });

            return res.sendSuccess(res, {message: "Unliked a Post"});
          } else {
            await Likes.create({ user_id: userId, post_id: postId });
            await Posts.increment('likes_count', { by: 1, where: { id: postId } });

            return res.sendSuccess(res, {message: "Liked a Post"});
          }
        } catch (error: any) {
          console.log(error)
          return  res.sendError(res, error?.message);
      }
}


export const getLikes = async (req: Request, res: Response) => {
    const searchTerm = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereCondition: any = {};
    const { postId }: any = req.query;

    try {
        if (searchTerm) {
            whereCondition[Op.or] = [
                { '$user.firstname$': { [Op.iLike]: `%${searchTerm}%` } },
                { '$user.handle$': { [Op.iLike]: `%${searchTerm}%` } },
            ];
        }

        if (!postId) {
            return res.sendError(res, "Post Id is Missing");
        }

          const { count, rows } = await Likes.findAndCountAll({
            where: {...whereCondition, post_id: postId},
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

          return res.sendPaginationSuccess(res, rows,count);
    } catch (error: any) {
        console.log(error)
        return  res.sendError(res, error?.message);
    }
}