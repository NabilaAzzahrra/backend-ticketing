"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Headofdivision extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Headofdivision.belongsTo(models.Division, {
        foreignKey: "division_id",
        as: "division",
      });

      Headofdivision.belongsTo(models.User, {
        foreignKey: "nik_headof",
        sourceKey: "nik",
        as: "user",
      });
    }
  }
  Headofdivision.init(
    {
      nik_headof: DataTypes.STRING,
      division_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Headofdivision",
    },
  );
  return Headofdivision;
};
