"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Relasi ke user (pembuat)
      Ticket.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      // Relasi ke staff
      Ticket.belongsTo(models.User, {
        foreignKey: "staff_id",
        as: "staff",
      });
    }
  }
  Ticket.init(
    {
      user_id: DataTypes.INTEGER,
      staff_id: DataTypes.INTEGER,
      complaint: DataTypes.TEXT,
      photo: DataTypes.TEXT,
      message: DataTypes.TEXT,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Ticket",
    }
  );
  return Ticket;
};
