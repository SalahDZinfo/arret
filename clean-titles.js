const { Specialite, sequelize } = require('./models');

async function cleanTitles() {
    try {
        await sequelize.authenticate();
        console.log("Database connected.");

        const specialties = await Specialite.findAll();
        let updatedCount = 0;

        for (let s of specialties) {
            if (s.title && /^\d+[\.\-]?\s*/.test(s.title)) {
                s.title = s.title.replace(/^\d+[\.\-]?\s*/, '').trim();
                await s.save();
                updatedCount++;
            }
        }
        
        console.log(`Cleaned ${updatedCount} specialty titles successfully!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanTitles();
