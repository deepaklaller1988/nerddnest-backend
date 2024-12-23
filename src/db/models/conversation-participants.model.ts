import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Users from './users.model';
import Conversation from './conversation.model';


const ConversationParticipants = db.define('conversation_participants', {
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
    is_archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
});

ConversationParticipants.belongsTo(Users, {
  foreignKey: "user_id",
  as: "user",
});

ConversationParticipants.belongsTo(Conversation, {
  foreignKey: "conversation_id",
  as: "conversation",
});

ConversationParticipants.sync()

export default ConversationParticipants;