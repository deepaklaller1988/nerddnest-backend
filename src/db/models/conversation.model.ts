import { DataTypes } from 'sequelize';
import db from '../dbConnect';
import Users from './users.model';


const Conversation = db.define('conversations', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
      type: DataTypes.STRING
    },
    is_group: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      foreignKey: true,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
});

Conversation.belongsTo(Users, {
  foreignKey: "created_by",
  as: "creator",
});

export default Conversation;