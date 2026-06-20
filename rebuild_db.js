const { sequelize } = require('./models');

async function rebuild() {
    console.log("Rebuilding database with force: true...");
    await sequelize.sync({ force: true });
    console.log("Database rebuilt!");
    process.exit(0);
}

rebuild().catch(err => {
    console.error(err);
    process.exit(1);
});
