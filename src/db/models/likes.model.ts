import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Posts from './posts.model';
import Users from './users.model';


const Likes = db.define('likes', {
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
    post_id: {
      type: DataTypes.INTEGER,
      foreignKey: true,
      allowNull: false,
      references: { model: 'posts', key: 'id' },
      onDelete: 'CASCADE',
    },
});

Likes.belongsTo(Users, {
  foreignKey: "user_id",
  as: "user",
});

Likes.belongsTo(Posts, {
  foreignKey: "post_id",
  as: "post",
});

Likes.sync()

export default Likes;