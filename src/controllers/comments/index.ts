import { Request, Response } from 'express';
import sequelize from '../../db/dbConnect';
import { Op } from 'sequelize';
import Posts from '../../db/models/posts.model';
import Users from '../../db/models/users.model';
import Likes from '../../db/models/likes.model';
import Comments from '../../db/models/comments.model';

export const postComment = async (req: Request, res: Response) =>{
    try {
        const { postId, commenterId, comment, contentType, mediaUrl  } = req.body;

        const post = await Posts.findOne({ where: { id: postId } });

        if (!post) {
          return  res.sendError(res, 'Post not found.');
        }

        const newComment = await Comments.create({
            commenter_id: commenterId,
            post_id: postId,
            comment,
            content_type: contentType,
            media_url: mediaUrl,
          });

        post.comments_count += 1;
        await post.save()

        return res.sendSuccess(res, newComment);
        } catch (error: any) {
          console.log(error)
          return  res.sendError(res, error?.message);
      }
}


export const getComments = async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { postId }: any = req.query;

    try {
        if (!postId) {
            return res.sendError(res, "Post Id is Missing");
        }

          const { count, rows } = await Comments.findAndCountAll({
            where: {post_id: postId, parent_id: null,},
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
            order: [['id', 'ASC']], // Newest posts first
            offset,
            limit: Number(limit),
          });

          return res.sendPaginationSuccess(res, rows,count);
    } catch (error: any) {
        console.log(error)
        return  res.sendError(res, error?.message);
    }
}

export const postReplyComment = async (req: Request, res: Response) =>{
    try {
        const { postId, commenterId, comment, commentId  } = req.body;

        const comm = await Comments.findOne({ where: { id: commentId } });

        const post = await Posts.findOne({ where: { id: postId } });

        if (!post) {
          return  res.sendError(res, 'Post not found.');
        }

        if (!comm) {
          return  res.sendError(res, 'Comment not found.');
        }

        const newComment = await Comments.create({
            commenter_id: commenterId,
            post_id: postId,
            parent_id: commentId,
            comment,
          });

        post.comments_count += 1;
        await post.save()

        return res.sendSuccess(res, newComment);
        } catch (error: any) {
          console.log(error)
          return  res.sendError(res, error?.message);
      }
}


export const deleteComment = async (req: Request, res: Response) =>{
    if (!req.body.id) {
        return res.sendError(res, 'Need Comment Id');
    }
    try {
        const comment = await Comments.findOne({ where: { id: req.body.id } });
        if (!comment) {
            return  res.sendError(res, 'Comment not found.');
          }

        const post = await Posts.findOne({ where: { id: comment?.dataValues?.post_id } });
        if (!post) {
            return  res.sendError(res, 'Post not found.');
          }

        const del = await Comments.destroy({
            where: {
                id: req.body.id
            }
        });

        post.comments_count= post.comments_count - 1;
        await post.save()

        return res.sendSuccess(res, del);

    } catch (error: any) {
        console.log(error)
        return res.sendError(res, error.message);
    }
}
