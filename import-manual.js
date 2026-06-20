const fs = require('fs');
const { Domaine, Specialite, sequelize } = require('./models');

async function importManual() {
    try {
        await sequelize.authenticate();
        console.log("Database connected.");

        const content = fs.readFileSync('import-manual.txt', 'utf-8');
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        const targetSubjectId = 3; // "اختبار تقني في التخصص" for Annexe 1
        
        console.log("Parsing text and saving new domain and specialties to DB...");

        let currentDomaine = null;
        let currentSpecialite = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (/^مجال[\s:]/.test(line) || line.startsWith('مجال')) {
                const title = line.replace(/^مجال[\s:]*/, '').trim();
                currentDomaine = await Domaine.create({ title, subjectId: targetSubjectId });
                currentSpecialite = null;
            } else if (/(التخصصات|التخصص|تخصصات|تخصص)/.test(line)) {
                // Strip everything up to "تخصص" or "التخصص" and its trailing spaces/colons
                let title = line.replace(/^.*?(التخصصات|التخصص|تخصصات|تخصص)[\s:]*/, '').trim();
                // Strip any remaining leading numbers or dashes just in case
                title = title.replace(/^\d+[\.\-]?\s*/, '').trim();
                
                if (currentDomaine) {
                    currentSpecialite = await Specialite.create({ title, content: '', domaineId: currentDomaine.id });
                }
            } else {
                // Content line for the current specialty
                if (currentSpecialite) {
                    // Clean leading symbols like -, *, •
                    let cleanedLine = line.replace(/^([\s\*\-\•\_]+|(\d+[\.\-\)]\s*))+/g, '').trim();
                    if (cleanedLine) {
                        currentSpecialite.content += `<p>${cleanedLine}</p>`;
                        await currentSpecialite.save();
                    }
                }
            }
        }
        
        console.log("Imported manual block successfully!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

importManual();
