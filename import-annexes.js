const fs = require('fs');
const path = require('path');
const { parseWordDocument } = require('./utils/parser');
const { Annexe, Exam, Subject, Domaine, Specialite, sequelize } = require('./models');

async function importAnnexes() {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log("Database connected and synced.");

        const filePath = 'C:/Users/salah/Desktop/المقرر النهائي/AR/الملاحق 7-24.docx';
        const buffer = fs.readFileSync(filePath);
        
        console.log("Parsing DOCX...");
        const parsedAnnexes = await parseWordDocument(buffer, path.basename(filePath));
        
        console.log(`Found ${parsedAnnexes.length} annexes.`);

        for (const parsedData of parsedAnnexes) {
            console.log(`Creating Annexe: ${parsedData.title}`);
            const annexe = await Annexe.create({ title: parsedData.title });

            const writtenExam = await Exam.create({
                title: 'الاختبارات الكتابية للقبول',
                type: 'written',
                annexeId: annexe.id
            });

            await Exam.create({
                title: 'المحادثة / المقابلة الشفهية',
                type: 'oral',
                content: '<p>محادثة مع أعضاء لجنة الامتحان في موضوع عام أو ذي علاقة بالتخصص بهدف تقييم قدرة المترشح على التواصل، ومهارته في التعبير، ومدى استعداده للقيام بالمهام المرتبطة بالرتبة.</p>',
                annexeId: annexe.id
            });

            for (const sub of parsedData.subjects) {
                const subject = await Subject.create({
                    title: sub.title,
                    is_common: sub.is_common,
                    content: sub.content,
                    examId: writtenExam.id
                });
                
                if (!sub.is_common && sub.domaines) {
                    for (const dom of sub.domaines) {
                        const domaine = await Domaine.create({ title: dom.title, subjectId: subject.id });
                        
                        if (dom.specialties) {
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
            }
        }
        
        console.log("All imported successfully!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

importAnnexes();
