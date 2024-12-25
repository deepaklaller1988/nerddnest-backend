import { sendMessages, startConversation } from '../../../controllers/messages';
import Users from '../../../db/models/users.model';
import RedisConn from '../../redis/redis-connection';
import logger from '../../logger';

const onlineUsersKey = "online_users";

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
        console.log(`User ${userId} is offline.`);
        socket.broadcast.emit("userStatusUpdate", { userId, status: "offline" });

        callback({ success: true, data: user });
      });

      socket.on("startConversation", async (data: any, callback: any) => {
        const { participantIds, senderId, content, mediaType,mediaUrl } = data;
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
            socket.broadcast.emit("msg-receive", { senderId, conversationId: result.data ? result.data.conversation_id : null });
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
            socket.broadcast.emit("msg-receive", { senderId, conversationId });
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