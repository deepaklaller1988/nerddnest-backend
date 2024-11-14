'use strict';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../dbConnect';
import { UserAttributes } from 'types/userTypes';

const Users = sequelize.define<Model<UserAttributes>>('users', {
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
}, {
  modelName: 'users',
  timestamps: true,
});

export default Users;
