import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Users from './users.model';


const CommentLike = db.define('comment_likes', {
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
    comment_id: {
      type: DataTypes.INTEGER,
      foreignKey: true,
      allowNull: false,
      references: { model: 'comments', key: 'id' },
      onDelete: 'CASCADE',
    },
});

CommentLike.belongsTo(Users, {
  foreignKey: "user_id",
  as: "user",
});


CommentLike.sync()

export default CommentLike;