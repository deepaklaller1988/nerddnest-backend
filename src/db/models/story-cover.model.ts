import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Posts from './posts.model';
import Users from './users.model';
import Story from './story.model';


const StoryCover = db.define('story_covers', {
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
    cover_title: {
      type: DataTypes.TEXT
    },
    media_url: {
      type: DataTypes.STRING
    },
    expiresAt: {
      type: DataTypes.DATE
    },
});

StoryCover.belongsTo(Users, {
  foreignKey: "user_id",
  as: "user",
});

StoryCover.associate = (models: any) => {
  StoryCover.hasMany(models.Story, {
    foreignKey: "story_cover_id",
    as: "stories",
  });
};

StoryCover.sync()

export default StoryCover;