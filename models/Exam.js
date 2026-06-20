const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Exam = sequelize.define('Exam', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    titleFr: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: { type: DataTypes.ENUM('written', 'oral'), defaultValue: 'written' },
    content: { type: DataTypes.TEXT, allowNull: true }, // For oral interview standard text
}, {
    tableName: 'exams'
});

module.exports = Exam;
