import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Users from './users.model';
import Posts from './posts.model';


const Comments = db.define('comments', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    commenter_id: {
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
    parent_id: {
      type: DataTypes.INTEGER
    },
    comment: {
      type: DataTypes.TEXT
    },
    likes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    content_type: {
      type: DataTypes.STRING
    },
    media_url: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
    },
});

Comments.belongsTo(Users, {
  foreignKey: "commenter_id",
  as: "commenter",
});

Comments.belongsTo(Posts, {
  foreignKey: "post_id",
  as: "post",
});

Comments.belongsTo(Comments, {
  foreignKey: "parent_id",
  as: "parent_comment",
});

Comments.hasMany(Comments, {
  foreignKey: 'parent_id',
  as: 'replies', // Alias for child comments (optional)
});

Comments.sync()

export default Comments;