const { User, sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function seed() {
    await sequelize.sync({ alter: true });
    console.log("Database synced.");
    
    const count = await User.count();
    if (count === 0) {
        await User.create({
            username: 'admin',
            password: 'password123',
            role: 'ADMIN',
            name: 'المدير العام'
        });
        console.log("Admin user created (admin / password123)");
    } else {
        console.log("Users already exist, skipping admin creation.");
    }
    process.exit(0);
}
seed();
