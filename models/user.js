"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // User sebagai PEMBUAT ticket
      User.hasMany(models.Ticket, {
        foreignKey: "user_id",
        as: "createdTickets",
      });

      // User sebagai STAFF penangan ticket
      User.hasMany(models.Ticket, {
        foreignKey: "staff_id",
        as: "assignedTickets",
      });

      User.belongsTo(models.Employee, {
        foreignKey: "nik",
        targetKey: "nik",
        as: "employee",
      });

      User.hasMany(models.Headofdivision, {
        foreignKey: "nik_headof",
        sourceKey: "nik",
        as: "headDivisions",
      });

      User.hasMany(models.Configuration, {
        foreignKey: 'campus_principle_nik',
        sourceKey: "nik",
        as: 'campusPrinciple',
      });
      
      User.hasMany(models.Configuration, {
        foreignKey: 'hrd_nik',
        sourceKey: "nik",
        as: 'hrd',
      });
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      refresh_token: DataTypes.TEXT,
      nik: DataTypes.STRING,
      role: DataTypes.STRING,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
    },
  );
  return User;
};
