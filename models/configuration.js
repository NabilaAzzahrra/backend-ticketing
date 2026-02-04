"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Configuration extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Configuration.belongsTo(models.User, {
        foreignKey: "campus_principle_nik",
        targetKey: "nik",
        as: "campusPrinciple",
      });
      
      Configuration.belongsTo(models.User, {
        foreignKey: "hrd_nik",
        targetKey: "nik",
        as: "hrd",
      });
    }
  }
  Configuration.init(
    {
      campus_principle_nik: DataTypes.STRING,
      hrd_nik: DataTypes.STRING,
      meal_allowance: DataTypes.STRING,
      transportation: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Configuration",
    },
  );
  return Configuration;
};
