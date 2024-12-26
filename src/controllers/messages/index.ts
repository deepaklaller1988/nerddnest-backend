import sequelize from '../../db/dbConnect';
import Posts from '../../db/models/posts.model';
import { Request, Response } from 'express';
import Connections from '../../db/models/connections.model';
import { Sequelize, Op } from "sequelize";
import Users from '../../db/models/users.model';
import Conversation from '../../db/models/conversation.model';
import ConversationParticipants from '../../db/models/conversation-participants.model';
import Messages from '../../db/models/messages.model';


const startConversation = async (data: any) => {
    const transaction = await sequelize.transaction();
    try {
        const { participantIds, senderId, content, mediaType,mediaUrl } = data;

        if(participantIds && participantIds.length > 0){
            const participants = await Users.findAll({where:{
                id: participantIds.slice(0,2)
            }});

            let lname: string = "";

            if(participants && participants.length > 0){
                lname = participants.map((item: any) => item.firstname).join(",");     
            }

            const conversationData = {
                created_by: senderId,
                is_group: participantIds.length > 1 ? true : false,
                name: lname
            }

            const conversation = await Conversation.create(conversationData, { transaction });

            await ConversationParticipants.create( {
                user_id: Number(senderId),
                conversation_id: conversation.id,
            } , { transaction });

            for await(let partId of participantIds){
                let conversationPartners = {
                    user_id: Number(partId),
                    conversation_id: conversation.id,
                } 

                await ConversationParticipants.create(conversationPartners, { transaction });
            }

            const messageData = {
                sender_id: senderId,
                conversation_id: conversation.id,
                content: content,
                media_url: mediaUrl,
                media_type: mediaType,
            }

            const message = await Messages.create(messageData, { transaction });
            await transaction.commit();
            return {success: true, data: message.dataValues}
        }
    } catch (error:any) {
        if (transaction) await transaction.rollback();
        console.log(error.message)
        return {success: false, error: error.message}
    }
}


const sendMessages = async (data: any) => {
    const transaction = await sequelize.transaction();
    try {
        const { conversationId, senderId, content, mediaType,mediaUrl } = data;

            const messageData = {
                sender_id: senderId,
                conversation_id: conversationId,
                content: content,
                media_url: mediaUrl,
                media_type: mediaType,
            }

            const message = await Messages.create(messageData, { transaction });
            await transaction.commit();
            return {success: true, data: message.dataValues}

    } catch (error:any) {
        if (transaction) await transaction.rollback();
        console.log(error.message)
        return {success: false, error: error.message}
    }
}

const getMessages = async (req: Request, res: Response) => {
    const searchTerm = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereCondition: any = {};
    const { pagination, conversationId }: any = req.query;

    try {
        if (searchTerm) {
            whereCondition[Op.or] = [
                { content: { [Op.iLike]: `%${searchTerm}%` } },
                { '$sender.firstname$': { [Op.iLike]: `%${searchTerm}%` } },
            ];
        }

        if (!conversationId) {
            return res.sendError(res, "Conversation Id is Missing");
        }
        
        if(pagination === 'true'){
            
            const { count, rows } = await Messages.findAndCountAll({
                where: {
                    conversation_id: conversationId
                },
                include: [
                    {
                    model: Users,
                    as: 'sender',
                    attributes: ['id', 'firstname','lastname','handle', 'image'], // Post creator info
                    }
                ],
                order: [['createdAt', 'DESC'],['createdAt', 'DESC']], // Newest posts first
                offset,
                limit: Number(limit),
            });

            return res.sendPaginationSuccess(res, rows,count);
            
          }else{
            const rows = await Messages.findAll({
                where: {
                  conversation_id: conversationId
                },
                include: [
                  {
                    model: Users,
                    as: 'sender',
                    attributes: ['id', 'firstname','lastname','handle', 'image'], // Post creator info
                  }
                ],
                order: [['createdAt', 'DESC'],['createdAt', 'DESC']], // Newest posts first
              });
    
              return res.sendSuccess(res, rows);
          }
    } catch (error: any) {
        console.log(error)
        return  res.sendError(res, error?.message);
    }
}

const getConversations = async (req: Request, res: Response) => {
    const searchTerm = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { pagination, userId }: any = req.query;
    const whereCondition: any = [];

    try {
        if (searchTerm) {
            whereCondition.push(`
              (
                c.name ILIKE '%${searchTerm}%'
              )
            `);
        }

        if (!userId) {
            return res.sendError(res, "Conversation Id is Missing");
        }


        whereCondition.push(`cp.user_id = ${userId}`)


        // const whereClause = whereCondition.length > 0 ? `WHERE ${whereCondition.join(' AND ')}` : '';
        const whereClause = whereCondition.length > 0 ? `WHERE ${whereCondition.join(' AND ')}` : '';


        const countQuery = `
            WITH latest_conversations AS (
                SELECT 
                    c.*, 
                    cp.user_id, 
                    latest_messages.latest_message_time
                FROM conversations c
                JOIN (
                    SELECT m.conversation_id, MAX(m."createdAt") AS latest_message_time
                    FROM messages m
                    GROUP BY m.conversation_id
                ) latest_messages ON c.id = latest_messages.conversation_id
                JOIN conversation_participants cp ON cp.conversation_id = c.id
                ${whereClause}
            )
            SELECT COUNT(*) AS total_count 
            FROM latest_conversations
            `;
        
            const dataQuery =
            `
                WITH latest_conversations AS (
                    SELECT 
                        c.*, 
                        cp.user_id, 
                        latest_messages.latest_message_time
                    FROM conversations c
                    JOIN (
                        SELECT m.conversation_id, MAX(m."createdAt") AS latest_message_time
                        FROM messages m
                        GROUP BY m.conversation_id
                    ) latest_messages ON c.id = latest_messages.conversation_id
                    JOIN conversation_participants cp ON cp.conversation_id = c.id
                    ${whereClause}
                )
                SELECT * 
                FROM latest_conversations
                ORDER BY latest_message_time DESC
            `;


            const [countResult, rows] = await Promise.all([
                sequelize.query(countQuery, {
                    type: sequelize.QueryTypes.SELECT,
                }),
                sequelize.query(dataQuery, {
                    replacements: { limit, offset },
                    type: sequelize.QueryTypes.SELECT,
                })
            ]);

            let data = [];

            for await (let row of rows){
                const participant = await ConversationParticipants.findAll({
                    where: {
                        conversation_id: row.id,
                        user_id: { [Op.not]: userId}
                    },
                    include: [
                        {
                        model: Users,
                        as: 'user',
                        attributes: ['id', 'firstname','lastname','handle', 'image'], // Post creator info
                        }
                    ],
                })
                
                let conversationName = participant && participant.length > 0 ? participant.map((item: any) => item?.user?.firstname).join(", ") : row.name;

                data.push({
                    ...row,
                    conversation_name: conversationName
                })
            }
    
            const totalCount = countResult && countResult.length > 0 ? Number(countResult[0].total_count) : 0;
    
            // let result = data.slice(offset, offset + limit);
    
            // return res.sendPaginationSuccess(res, result, data.length);
            return res.sendPaginationSuccess(res, data, totalCount);
            
    } catch (error: any) {
        console.log(error)
        return  res.sendError(res, error?.message);
    }
}

export {startConversation, sendMessages, getMessages, getConversations}