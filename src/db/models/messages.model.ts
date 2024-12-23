import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Users from './users.model';
import Conversation from './conversation.model';


const Messages = db.define('messages', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    sender_id: {
      type: DataTypes.INTEGER,
      foreignKey: true,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    conversation_id: {
      type: DataTypes.INTEGER,
      foreignKey: true,
      allowNull: false,
      references: { model: 'conversations', key: 'id' },
      onDelete: 'CASCADE',
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    content: {
      type: DataTypes.TEXT
    },
    media_url: {
      type: DataTypes.ARRAY(DataTypes.TEXT)
    },
    media_type: {
      type: DataTypes.STRING
    },
});

Messages.belongsTo(Users, {
  foreignKey: "sender_id",
  as: "sender",
});

Messages.belongsTo(Conversation, {
  foreignKey: "conversation_id",
  as: "conversation",
});

Messages.sync()

export default Messages;