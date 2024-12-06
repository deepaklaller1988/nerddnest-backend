import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Users from './users.model';
import Likes from './likes.model';
import Comments from './comments.model';

const Posts = db.define('posts', {
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
  post_type: {
    type: DataTypes.STRING
  },
  content: {
    type: DataTypes.TEXT
  },
  media_url: {
    type: DataTypes.ARRAY(DataTypes.TEXT)
  },
  shared_link: {
    type: DataTypes.TEXT
  },
  likes_count: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  comments_count: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  shares_count: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  schedule_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_scheduled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  visibility: {
    type: DataTypes.ENUM('public', 'all-members', 'connections', 'only-me', 'archived', 'groups'),
    defaultValue: 'public',
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_commenting_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

Posts.belongsTo(Users, {
  foreignKey: "user_id",
  as: "user",
});

Posts.sync()

export default Posts;
