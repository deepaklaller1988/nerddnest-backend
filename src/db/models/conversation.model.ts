import { DataTypes } from 'sequelize';
import db from '../dbConnect';


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
});

export default Conversation;