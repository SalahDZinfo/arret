const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subject = sequelize.define('Subject', {
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
    },
    is_common: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_reusable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    content: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    contentFr: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    examId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'subjects',
    timestamps: true
});

module.exports = Subject;
