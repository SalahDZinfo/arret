const fs = require('fs');
const path = require('path');
const { parseWordDocument } = require('./utils/parser');
const { Annexe, Subject, Domaine, Specialite, sequelize } = require('./models');

const directoryPath = 'c:\\Users\\salah\\Desktop\\المقرر النهائي\\AR';

async function seedDatabase() {
    try {
        console.log('Syncing database...');
        await sequelize.sync({ force: true });

        console.log('Reading directory...');
        const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.docx'));
        
        let allParsedData = [];

        for (const file of files) {
            console.log(`Processing file: ${file}...`);
            const filePath = path.join(directoryPath, file);
            const buffer = fs.readFileSync(filePath);
            
            const parsedData = await parseWordDocument(buffer, file);
            allParsedData.push(parsedData);
            
            // Insert to DB
            const annexe = await Annexe.create({ title: parsedData.title });
            
            for (const sub of parsedData.subjects) {
                const subject = await Subject.create({
                    title: sub.title,
                    is_common: sub.is_common,
                    content: sub.content,
                    annexeId: annexe.id
                });
                
                if (!sub.is_common) {
                    for (const dom of sub.domaines) {
                        const domaine = await Domaine.create({ title: dom.title, subjectId: subject.id });
                        
                        for (const spec of dom.specialties) {
                            await Specialite.create({
                                title: spec.title,
                                content: spec.content,
                                domaineId: domaine.id
                            });
                        }
                    }
                }
            }
            console.log(`Finished inserting ${file} to database.`);
        }

        // Save JSON file
        const jsonFilePath = path.join(directoryPath, 'all_data.json');
        fs.writeFileSync(jsonFilePath, JSON.stringify(allParsedData, null, 2), 'utf8');
        console.log(`\nAll data has been saved to ${jsonFilePath}`);
        console.log('Database seeding completed successfully.');

    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        await sequelize.close();
    }
}

seedDatabase();
