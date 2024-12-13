import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Users from './users.model';
import StoryCover from './story-cover.model';


const Story = db.define('stories', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    story_cover_id: {
      type: DataTypes.INTEGER,
      foreignKey: true,
      allowNull: false,
      references: { model: 'story_covers', key: 'id' },
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.INTEGER,
      foreignKey: true,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    story_text: {
      type: DataTypes.TEXT
    },
    story_link: {
      type: DataTypes.TEXT
    },
    media_url: {
      type: DataTypes.STRING
    },
    duration: {
      type: DataTypes.INTEGER
    },
    visibility: {
      type: DataTypes.ENUM('public', 'connections', 'only-me'),
      defaultValue: 'public',
    },
    expiresAt: {
      type: DataTypes.DATE
    },
});

Story.belongsTo(Users, {
  foreignKey: "user_id",
  as: "user",
});

Story.belongsTo(StoryCover, {
  foreignKey: "story_cover_id",
  as: "story_cover",
});

Story.sync()

export default Story;