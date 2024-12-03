import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Users from './users.model';


const Friends = db.define('friends', {
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
    }
});

Friends.belongsTo(Users, {
  foreignKey: "user_id",
  as: "user",
});

Friends.belongsTo(Users, {
  foreignKey: "friend_id",
  as: "friend",
});

Friends.sync()

export default Friends;

