'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Division extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Division.hasMany(models.Employee, {
        foreignKey: 'division_id',
        as: 'employees',
      });
      Division.hasMany(models.Headofdivision, {
        foreignKey: 'division_id',
        as: 'headofdivision',
      });
    }
  }
  Division.init({
    division: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Division',
  });
  return Division;
};