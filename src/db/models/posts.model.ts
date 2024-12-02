import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Users from './users.model';

const Posts = db.define('posts', {
  id: {
    allowNull: false,
    autoIncrement: true,
    type: DataTypes.INTEGER,
    unique: true
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
});

Posts.belongsTo(Users, {
  foreignKey: "user_id",
  as: "user",
});

Posts.sync()

export default Posts;
