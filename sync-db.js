const { sequelize } = require('./models');

async function sync() {
  await sequelize.sync({ alter: true });
  console.log("Database synchronized with alter: true");
  process.exit(0);
}
sync();
