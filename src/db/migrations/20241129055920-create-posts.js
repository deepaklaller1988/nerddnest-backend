'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('posts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        foreignKey: true,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      post_type: {
        type: Sequelize.STRING
      },
      content: {
        type: Sequelize.TEXT
      },
      media_url: {
        type: Sequelize.ARRAY(Sequelize.TEXT)
      },
      shared_link: {
        type: Sequelize.TEXT
      },
      likes_count: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
      },
      comments_count: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
      },
      shares_count: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('posts');
  }
};