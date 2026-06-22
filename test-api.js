const { Annexe, Exam, Subject, Domaine, Specialite } = require('./models');

async function test() {
    try {
        const count = await Annexe.count();
        console.log(`Annexes count: ${count}`);

        const annexes = await Annexe.findAll({
            include: [
                {
                    model: Exam, as: 'exams',
                    include: [
                        {
                            model: Subject, as: 'subjects',
                            include: [
                                {
                                    model: Domaine, as: 'domaines',
                                    include: [{ model: Specialite, as: 'specialties' }]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        console.log(`Annexes findAll returned array of length: ${annexes.length}`);
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}
test();
