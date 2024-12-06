'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('posts', 'is_commenting_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    })

    await queryInterface.addColumn('posts', 'is_pinned', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('posts', 'visibility', {
      type: Sequelize.ENUM('public', 'all-members', 'connections', 'only-me', 'archived', 'groups'),
      defaultValue: 'public',
    })

    await queryInterface.addColumn('posts', 'schedule_time', {
      type: Sequelize.DATE,
      allowNull: true,
    })

    await queryInterface.addColumn('posts', 'is_scheduled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('posts', 'is_published', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('posts', 'is_published');
    await queryInterface.removeColumn('posts', 'is_scheduled');
    await queryInterface.removeColumn('posts', 'schedule_time');
    await queryInterface.removeColumn('posts', 'visibility');
    await queryInterface.removeColumn('posts', 'is_pinned');
    await queryInterface.removeColumn('posts', 'is_commenting_enabled');
  }
};
