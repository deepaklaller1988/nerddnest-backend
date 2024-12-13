import { Request, Response } from 'express';
import sequelize from '../../db/dbConnect';
import { Op } from 'sequelize';
import Users from '../../db/models/users.model';
import StoryCover from '../../db/models/story-cover.model';
import moment from 'moment';
import Story from '../../db/models/story.model';
import Connections from '../../db/models/connections.model';

const createStory = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {

        if (!req.body.userId) {
            return res.sendError(res, "User Id is Missing");
        }

        const data: any = {
            user_id: req.body.userId,
            cover_title: req.body.coverTitle,
            media_url: req.body.mediaUrl,
            expiresAt: moment().add(24, 'hours').toDate()
        };

        const cover = await StoryCover.create(data, { transaction });

        if(cover){
            for await (const story of req.body.stories) {
                let storyData = {
                    story_cover_id: cover.id,
                    user_id: req.body.userId,
                    story_text: story.storyText,
                    story_link: story.storyLink,
                    media_url: story.mediaUrl,
                    duration: story.duration,
                    visibility: story.visibility || 'public',
                    expiresAt: moment().add(24, 'hours').toDate()
                }

                const str = await Story.create(storyData, { transaction });
            }
        }
        await transaction.commit();
        return res.sendSuccess(res, cover);     
    } catch (error: any) {
        console.log(error)
        if (transaction) await transaction.rollback();
        return  res.sendError(res, error?.message);
    }
}

const getStories = async (req: Request, res: Response) => {
    const { userId }: any = req.query;
    try {

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

          const dataQuery =
            `
            SELECT 
                sc.id,
                sc.cover_title,
                sc.media_url,
                sc."expiresAt",
                sc."createdAt",
                JSON_BUILD_OBJECT(
                    'id', u.id,
                    'firstname', u.firstname,
                    'lastname', u.lastname,
                    'handle', u.handle,
                    'image', u.image
                ) AS user,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'story_id', s.id,
                            'story_text', s.story_text,
                            'media_url', s.media_url,
                            'duration', s.duration,
                            'visibility', s.visibility,
                            'expires_at', s."expiresAt"
                        )
                    ) FILTER (WHERE s.id IS NOT NULL),
                    '[]'
                ) AS stories
            FROM 
                story_covers AS sc
            LEFT JOIN 
                users AS u ON sc.user_id = u.id
            LEFT JOIN 
                stories AS s ON s.story_cover_id = sc.id
            WHERE 
                (
                    (s.visibility = 'public')
                    OR (s.visibility = 'connections' AND (sc.user_id = :userId ${friendIds.length > 0 ? 'OR sc.user_id IN (:friendIds)' : ''}))
                    OR (s.visibility = 'only-me' AND sc.user_id = :userId)
                )
                AND sc."expiresAt" > NOW()  -- Check if cover has not expired
                AND s."expiresAt" > NOW()  -- Check if story has not expired
            GROUP BY 
                sc.id, u.id, u.firstname, u.lastname, u.handle, u.image
            ORDER BY 
                sc."createdAt" DESC
            `;

          const [results] = await Promise.all([
            sequelize.query(dataQuery, {
            replacements: { userId, friendIds },
              type: sequelize.QueryTypes.SELECT,
            })
          ]);
          
          return res.sendSuccess(res, results);
        } catch (error: any) {
            console.log(error)
            return  res.sendError(res, error?.message);
        }
}

export {createStory, getStories}