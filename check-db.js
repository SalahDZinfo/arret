const { Specialite, Domaine } = require('./models');

async function check() {
    const specs = await Specialite.findAll({ limit: 10 });
    console.log("Found specialties:", specs.map(s => ({
        id: s.id,
        title: s.title,
        content: s.content,
        domaineId: s.domaineId
    })));
    process.exit(0);
}

check();
