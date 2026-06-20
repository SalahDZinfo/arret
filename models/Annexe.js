const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Annexe = sequelize.define('Annexe', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    titleFr: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'annexes',
    timestamps: true
});

module.exports = Annexe;
