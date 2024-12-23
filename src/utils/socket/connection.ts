import { Server } from 'socket.io';
import logger from '../logger';
import { messageHandler } from './socket-handlers/messages';

let io;

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

const initializeIO =(io: any) =>{
    // Use the Socket.IO instance
    io.on("connection", (socket: any) => {
        console.log("New client connected:", socket.id);
        logger.info(`SOCKET IO | New Client Connected - ${socket.id}`)

        messageHandler(socket,io)
      });
}

export {
    io,
    initSocket
}