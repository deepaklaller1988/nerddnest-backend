'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('comments', 'media_url', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
    })

    await queryInterface.addColumn('comments', 'content_type', {
      type: Sequelize.STRING
    });
    
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('comments', 'content_type');
    await queryInterface.removeColumn('comments', 'media_url');
  }
};
