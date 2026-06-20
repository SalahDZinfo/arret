const fs = require('fs');
const { Domaine, Specialite, sequelize } = require('./models');

async function importDomainsAndSpecialties() {
    try {
        await sequelize.authenticate();
        console.log("Database connected.");

        const content = fs.readFileSync('extracted-1.txt', 'utf-8');
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        const targetSubjectId = 3; // "اختبار تقني في التخصص" for Annexe 1
        
        // Wipe old domains for this subject to avoid duplicates just in case
        await Domaine.destroy({ where: { subjectId: targetSubjectId } });

        console.log("Parsing text and saving new domains and specialties to DB...");

        let currentDomaine = null;
        let currentSpecialite = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (/^مجال[\s:]/.test(line) || line.startsWith('مجال')) {
                const title = line.replace(/^مجال[\s:]*/, '').trim();
                currentDomaine = await Domaine.create({ title, subjectId: targetSubjectId });
                currentSpecialite = null;
            } else if (/^(التخصص|تخصص)[\s:]/.test(line) || line.startsWith('التخصص') || line.startsWith('تخصص')) {
                const title = line.replace(/^(التخصص|تخصص)[\s:]*/, '').trim();
                if (currentDomaine) {
                    currentSpecialite = await Specialite.create({ title, content: '', domaineId: currentDomaine.id });
                }
            } else if (line.includes('اختبار تقني في التخصص')) {
                // Ignore this repeated header
                continue;
            } else {
                // Content line for the current specialty
                if (currentSpecialite) {
                    currentSpecialite.content += `<p>${line}</p>`;
                    await currentSpecialite.save();
                }
            }
        }
        
        console.log("All imported successfully!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

importDomainsAndSpecialties();
