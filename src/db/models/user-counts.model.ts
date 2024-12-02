import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Users from './users.model';

const UserCounts = db.define('user_counts', {
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
    no_of_posts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    no_of_friends: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    no_of_groups: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
});

UserCounts.belongsTo(Users, {
  foreignKey: "user_id",
  as: "user",
});

UserCounts.sync()

export default UserCounts;