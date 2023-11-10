import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableInfo: any = await queryInterface.describeTable("TicketTraking");

    // Se "queueId" não está presente no objeto que descreve as colunas, então adiciona
    if (!('queueId' in tableInfo)) {
      await queryInterface.addColumn("TicketTraking", "queueId", {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableInfo: any = await queryInterface.describeTable("TicketTraking");

    // Se "queueId" está presente no objeto que descreve as colunas, então remove
    if ('queueId' in tableInfo) {
      await queryInterface.removeColumn("TicketTraking", "queueId");
    }
  }
};
