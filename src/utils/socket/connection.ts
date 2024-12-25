import { Server } from 'socket.io';
import logger from '../logger';
import { messageHandler } from './socket-handlers/messages';
import RedisConn from '../redis/redis-connection';
import Users from '../../db/models/users.model';

let io;

const onlineUsersKey = "online_users";

const initSocket = (server: any) => {
    try {
        io = new Server(server, {
          cors: { origin: "*" },
        });
        console.log("Socket.IO initialized");
        logger.info(`SOCKET IO  - INTIALIZED SUCCESSFULLY`)

        initializeIO(io)
        return io;
        
    } catch (error) {
        console.log(error)
        logger.error(`SOCKET IO  - INTIALIZATION FAILED - ${error}`)
    }
  };

const initializeIO = async (io: any) =>{
    // Use the Socket.IO instance
    io.on("connection", async (socket: any) => {
        logger.info(`SOCKET IO | New Client Connected - ${socket.id}`)

        messageHandler(socket,io);

        socket.on("disconnect", async (reason: any, callback: any) => {
          const OnlineUser = await RedisConn.hget(onlineUsersKey, socket.id);
          if(OnlineUser){
            const user = await Users.findOne({
              where:{
                  id: Number(OnlineUser)
              }
          });
  
          if (!user) {
              return callback({ success: false, error: "User not found" });
            }
  
            user.online_status = false;
            await user.save();
            await RedisConn.hdel(onlineUsersKey, socket.id);
            socket.broadcast.emit("userStatusUpdate", { userId: OnlineUser, status: "offline" });
          }
          logger.error(`SOCKET IO | Client Disconnected - ${socket.id}: ${reason}`)
        });
      
        socket.on("error", (error: any) => {
          console.error("Socket error:", error.message);
          logger.error(`SOCKET IO | ${socket.id} | Error: ${error.message}`)
        });
      });
}

export {
    io,
    initSocket
}