const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'postgres://dummy:dummy@localhost:5432/dummy';
const sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false,
});

module.exports = sequelize;
