import { Server } from 'socket.io';
import logger from '../logger';
import { messageHandler } from './socket-handlers/messages';
import RedisConn from '../redis/redis-connection';
import Users from '../../db/models/users.model';
import { verifyToken } from "../handleToken";
import SocketUser from '../../db/models/socketuser.model';

let io: Server | undefined;

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

    io.use(async (socket: any, next: any) => {
      try {
        const token = socket.handshake.headers.authorization;
        console.log(token)
        if (!token) {
          throw new Error("Authentication token is required");
        }

        const { data, error }: any = await verifyToken(token, "access");
        if (error) {
          switch (error.name) {
            case "JsonWebTokenError":
              throw new Error("ERR_INVALID_ACCESS_TOKEN");
            case "TokenExpiredError":
              throw new Error("ERR_ACCESS_TOKEN_EXPIRED");
            default:
              throw new Error("ERR_INVALID_ACCESS_TOKEN");
          }
        }
    
        socket.user = data;
        next();
      } catch (error) {
        // Pass an error message to the client
        next(new Error("Invalid or missing authentication token"));
      }
    });

    // Use the Socket.IO instance
    io.on("connection", async (socket: any) => {
        logger.info(`SOCKET IO | New Client Connected - ${socket.id}`)

        const userId = socket.user.id;

        const sock = await SocketUser.create({
          user_id: userId,
          socket_id: socket.id
        })

        const user = await Users.findOne({
          where:{
              id: userId
          }
        });

        if (!user) {
         throw new Error("User not exist");
        }

        user.online_status = true;
        await user.save();

        messageHandler(socket,io);

        socket.on("disconnect", async (reason: any, callback: any) => {
          const userSockets = await SocketUser.findAll({
            where: {
              user_id: socket.user.id
            }
          })

          if(userSockets && userSockets.length > 1){
            await SocketUser.destroy({
              where:{
                socket_id: socket.id
              }
            })
          }else{
            await SocketUser.destroy({
              where:{
                socket_id: socket.id
              }
            });

            const user = await Users.findOne({
              where:{
                  id: Number(socket.user.id)
              }
          });
  
          if (!user) {
              return callback({ success: false, error: "User not found" });
            }
  
            user.online_status = false;
            await user.save();
            await RedisConn.hdel(onlineUsersKey, socket.id);  
            socket.broadcast.emit("userStatusUpdate", { userId: user.id, status: "offline" });
          }
          
            for (let room of socket.rooms) {
              if (room !== socket.id) { // Exclude the socket's own ID
                socket.leave(room);
                console.log(`Socket ${socket.id} left room ${room}`);
              }
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