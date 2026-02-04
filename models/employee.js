"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Employee.belongsTo(models.Division, {
        foreignKey: "division_id",
        as: "division",
      });

      Employee.hasMany(models.User, {
        foreignKey: "nik",
        sourceKey: "nik",
        as: "users",
      });
    }
  }
  Employee.init(
    {
      nik: DataTypes.STRING,
      phone: DataTypes.STRING,
      division_id: DataTypes.INTEGER,
      position: DataTypes.STRING,
      signature: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Employee",
    }
  );
  return Employee;
};
