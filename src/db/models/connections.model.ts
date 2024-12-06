import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Users from './users.model';


const Connections = db.define('connections', {
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
    friend_id: {
      type: DataTypes.INTEGER,
      foreignKey: true,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    request_status: {
      allowNull: false,
      type: DataTypes.STRING,
      defaultValue:"Pending"
    },
});

Connections.belongsTo(Users, {
  foreignKey: "user_id",
  as: "user",
});

Connections.belongsTo(Users, {
  foreignKey: "friend_id",
  as: "friend",
});

Connections.sync()

export default Connections;

