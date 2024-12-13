'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      story_cover_id: {
        type: Sequelize.INTEGER,
        foreignKey: true,
        allowNull: false,
        references: { model: 'story_covers', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        foreignKey: true,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      story_text: {
        type: Sequelize.TEXT
      },
      story_link: {
        type: Sequelize.TEXT
      },
      media_url: {
        type: Sequelize.STRING
      },
      duration: {
        type: Sequelize.INTEGER
      },
      visibility: {
        type: Sequelize.ENUM('public', 'connections', 'only-me'),
        defaultValue: 'public',
      },
      expiresAt: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('stories');
  }
};