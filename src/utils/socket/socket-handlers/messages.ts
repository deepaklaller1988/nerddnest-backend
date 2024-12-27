import { sendMessages, startConversation } from '../../../controllers/messages';
import { io } from '../connection';
import Users from '../../../db/models/users.model';
import RedisConn from '../../redis/redis-connection';
import logger from '../../logger';
import ConversationParticipants from '../../../db/models/conversation-participants.model';
import { Op } from 'sequelize';
import SocketUser from '../../../db/models/socketuser.model';

const onlineUsersKey = "online_users";
const onlineSoketsKey = "online_sockets";

const findSocketIdByUserId = async (socketId: any) => {

  // Ensure 'io' is defined
  if (!io) {
    logger.error("Socket.IO server is not initialized");
    return null;
  }

  // Retrieve the socket instance
  const socketInstance = io.sockets.sockets.get(socketId);
    if (!socketInstance) {
        logger.info(`Socket instance not found for ID: ${socketId}`);
        return null;
    }

    return socketInstance;
};


const messageHandler = async (socket: any,io: any) =>{

    socket.on('userOnline', async (data: any, callback: any) =>{
        const {userId} = data;
        if (!userId) {
            return callback({ success: false, error: "User ID is required" });
          }

        const user = await Users.findOne({
            where:{
                id: userId
            }
        });

        if (!user) {
            return callback({ success: false, error: "User not found" });
          }

          user.online_status = true;
          await user.save();

        const users = await RedisConn.hset(onlineUsersKey, socket.id, userId);
        const sockets = await RedisConn.hset(onlineSoketsKey, userId, socket.id);
        socket.emit("userStatusUpdate", { userId, status: "online" });

        callback({ success: true, data: user });
    });

    socket.on("userOffline", async (data: any, callback: any) => {
        const {userId} = data;
        if (!userId) {
            return callback({ success: false, error: "User ID is required" });
          }

        const user = await Users.findOne({
            where:{
                id: userId
            }
        });

        if (!user) {
            return callback({ success: false, error: "User not found" });
          }

          user.online_status = false;
          await user.save();

        await RedisConn.hdel(onlineUsersKey, socket.id);
        await RedisConn.hdel(onlineSoketsKey, userId);
        console.log(`User ${userId} is offline.`);
        socket.broadcast.emit("userStatusUpdate", { userId, status: "offline" });

        callback({ success: true, data: user });
      });

      socket.on("startConversation", async (data: any, callback: any) => {
        let { participantIds, senderId, content, mediaType,mediaUrl } = data;
        try {
            if(!senderId){
                return callback({ success: false, error: "Sender ID is required" });
            }

            const result: any = await startConversation(data);
            if(!result.success){
                logger.error(`SOCKET IO | Message Sending Failed - Sender: ${senderId}: ${result.error}`);
                if (typeof callback === "function") {
                    return callback({ success: false, error: result.error });
                  }
            }

            const conversationId = result.data.conversation_id;
            // socket.join(conversationId.toString())

            participantIds = [...participantIds, senderId]

            // Add participants to the room
            const addParticipantsToRoom = async () => {
              for (const participantId of participantIds) {
                const allSockets = await SocketUser.findAll({
                  where:{
                    user_id: participantId
                  },
                  raw: true
                });
                for await (let userSocket of allSockets){
                  const participantSocket: any = await findSocketIdByUserId(userSocket.socket_id); // Custom function to map userId to socket
                  if (participantSocket) {
                    participantSocket.join(conversationId.toString());
                    logger.info(`User ${participantId} joined room ${conversationId}`);
                  } else {
                    logger.info(`User ${participantId} is not online`);
                  }
                }
              }
            };

            await addParticipantsToRoom();

            io.to(conversationId.toString()).emit("msg-receive", result.data);
            callback({ success: true, data: result.data });
        } catch (error: any) {
            console.log(error.message)
            if (typeof callback === "function") {
                return callback({ success: false, error: error.message });
              }
        }
      });

      socket.on("sendMessage", async (data: any, callback: any) => {
        const { conversationId, senderId, content, mediaType,mediaUrl } = data;
        try {
            if(!senderId){
                return callback({ success: false, error: "Sender ID is required" });
            }

            if(!conversationId){
              return callback({ success: false, error: "Conversation ID is required" });
          }

            const result: any = await sendMessages(data);
            if(!result.success){
                logger.error(`SOCKET IO | Message Sending Failed - Sender: ${senderId}: ${result.error}`);
                if (typeof callback === "function") {
                    return callback({ success: false, error: result.error });
                  }
            }

            const participant = await ConversationParticipants.findAll({
              where: {
                  conversation_id: conversationId,
                  user_id: { [Op.not]: senderId}
              },
          })

          let participantIds = participant && participant.length > 0 ? participant?.map((item: any) => item.user_id) : []; 

            // socket.join(conversationId.toString())

            participantIds = [...participantIds, senderId]

            // Add participants to the room
            const addParticipantsToRoom = async () => {
              for (const participantId of participantIds) {
                const allSockets = await SocketUser.findAll({
                  where:{
                    user_id: participantId
                  },
                  raw: true
                });
                for await (let userSocket of allSockets){
                  const participantSocket: any = await findSocketIdByUserId(userSocket.socket_id); // Custom function to map userId to socket
                  if (participantSocket) {
                    participantSocket.join(conversationId.toString());
                    logger.info(`User ${participantId} joined room ${conversationId}`);
                  } else {
                    logger.info(`User ${participantId} is not online`);
                  }
                }
              }
            };

            await addParticipantsToRoom();

            io.to(conversationId.toString()).emit("msg-receive", result.data );
            callback({ success: true, data: result.data });
        } catch (error: any) {
            console.log(error.message)
            if (typeof callback === "function") {
                return callback({ success: false, error: error.message });
              }
        }
      });
}

export {messageHandler}