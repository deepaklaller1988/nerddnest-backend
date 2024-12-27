import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Users from './users.model';


const SocketUser = db.define('socket_users', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      foreignKey: true,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    socket_id: {
      type: DataTypes.STRING,
    },
});

SocketUser.belongsTo(Users, {
  foreignKey: "user_id",
  as: "user",
});

SocketUser.sync()

export default SocketUser;