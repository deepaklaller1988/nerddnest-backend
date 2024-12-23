import RedisConn from '../../redis/redis-connection';

const onlineUsersKey = "online_users";

const messageHandler = async (socket: any,io: any) =>{

    socket.on('userOnline', async (userId: number) =>{
        console.log(userId)
        await RedisConn.hset(onlineUsersKey, userId, socket.id);
        socket.broadcast.emit("userStatusUpdate", { userId, status: "online" });
    })

}

export {messageHandler}