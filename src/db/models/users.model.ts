import { DataTypes } from 'sequelize';
import db from '../dbConnect';

const Users = db.define('users', {
  id: {
    allowNull: false,
    autoIncrement: true,
    type: DataTypes.INTEGER,
    unique: true
  },
  userId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: {
        args: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        msg: 'Invalid email address format'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  handle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dob: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  refreshToken: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
});

Users.sync()

export default Users;
