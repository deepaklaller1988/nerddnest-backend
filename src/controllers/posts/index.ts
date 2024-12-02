import { Request, Response } from 'express';
import sequelize from '../../db/dbConnect';
import Posts from '../../db/models/posts.model';
import UserCounts from '../../db/models/user-counts.model';


const createPost = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {

        if (!req.body.userId) {
            return res.sendError(res, "User Id is Missing");
        }

        const data = {
            user_id: req.body.userId,
            post_type: req.body.postType,
            content: req.body.content,
            media_url: req.body.mediaUrl,
            shared_link: req.body.sharedLink  
        };

        const post = await Posts.create(data, { transaction });

        await UserCounts.increment('no_of_posts', {
            by: 1,
            where: { user_id: req.body.userId },
            transaction,
          });

          await transaction.commit();
          return res.sendSuccess(res, post);
    } catch (error: any) {
        console.log(error)
        if (transaction) await transaction.rollback();
        return  res.sendError(res, error?.message);
    }
}



export { createPost}