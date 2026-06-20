const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Specialite = sequelize.define('Specialite', {
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
    content: {
        type: DataTypes.TEXT('long'), // For storing HTML content from Word
        allowNull: true
    },
    contentFr: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    domaineId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'specialites',
    timestamps: true
});

module.exports = Specialite;
