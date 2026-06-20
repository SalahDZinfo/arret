const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Domaine = sequelize.define('Domaine', {
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
    subjectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'subjects', // or whatever the table name is
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'domaines',
    timestamps: true
});

module.exports = Domaine;
