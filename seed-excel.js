const xlsx = require('xlsx');
const { sequelize, Annexe, Exam, Subject, Domaine, Specialite, User } = require('./models');

async function seedDatabase() {
    try {
        console.log("0. Syncing Database Schema (Force Drop & Recreate)...");
        await sequelize.sync({ force: true });
        
        console.log("1. Clearing database (excluding Users)...");
        // We delete from bottom up to respect foreign keys, or just use destroy({ truncate: true, cascade: true })
        await Specialite.destroy({ where: {} });
        await Domaine.destroy({ where: {} });
        await Subject.destroy({ where: {} });
        await Exam.destroy({ where: {} });
        await Annexe.destroy({ where: {} });

        console.log("Database cleared.");

        const excelPath = 'C:\\Users\\salah\\Desktop\\annexes.xlsx';
        const workbook = xlsx.readFile(excelPath);

        const annexeConfig = {
            'ملحق01': ['اختبار تقني في التخصص'],
            'ملحق02': ['اختبار تقني في التخصص', 'اختبار تطبيقي'],
            'ملحق03': ['اختبار تقني في التخصص'],
            'ملحق04': ['اختبار في التكنولوجيا القاعدية'],
            'ملحق05': ['اختبار تقني في التخصص'],
            'ملحق06': ['اختبار في التكنولوجيا القاعدية']
        };

        for (let i = 1; i <= 6; i++) {
            const sheetName = `ملحق0${i}`;
            if (!workbook.SheetNames.includes(sheetName)) {
                console.warn(`Sheet ${sheetName} not found in Excel file! Skipping.`);
                continue;
            }

            console.log(`Processing ${sheetName}...`);
            const worksheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            
            const headerRow = rows[0] || [];
            let domaineIdx = 1;
            let specialiteIdx = 2;
            for (let c = 0; c < headerRow.length; c++) {
                const headerText = String(headerRow[c]).trim();
                if (headerText === 'المجال' || headerText.includes('مجال')) domaineIdx = c;
                if (headerText === 'التخصص' || headerText.includes('تخصص')) specialiteIdx = c;
            }

            // 2. Create Annexe
            const annexe = await Annexe.create({ title: sheetName });

            // 3. Create Written Exam
            const writtenExam = await Exam.create({
                title: 'الاختبارات الكتابية للقبول',
                type: 'written',
                annexeId: annexe.id
            });

            // (Optional) Add Oral Exam as before
            await Exam.create({
                title: 'المحادثة / المقابلة الشفهية',
                type: 'oral',
                content: '<p>محادثة مع أعضاء لجنة الامتحان في موضوع عام أو ذي علاقة بالتخصص بهدف تقييم قدرة المترشح على التواصل، ومهارته في التعبير، ومدى استعداده للقيام بالمهام المرتبطة بالرتبة.</p>',
                annexeId: annexe.id
            });

            const subjectsToCreate = annexeConfig[sheetName];
            
            for (const subjectTitle of subjectsToCreate) {
                const subject = await Subject.create({
                    title: subjectTitle,
                    is_common: false,
                    is_reusable: false,
                    content: '',
                    examId: writtenExam.id
                });

                // Map domains to their specialties for this sheet
                const domaineMap = new Map();
                
                for (let r = 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row || row.length < Math.max(domaineIdx, specialiteIdx)) continue; // Skip empty rows

                    let domaineName = row[domaineIdx];
                    let specialiteName = row[specialiteIdx];

                    if (!domaineName || !specialiteName) continue;
                    
                    domaineName = domaineName.toString().trim();
                    specialiteName = specialiteName.toString().trim();

                    if (!domaineMap.has(domaineName)) {
                        domaineMap.set(domaineName, new Set());
                    }
                    domaineMap.get(domaineName).add(specialiteName);
                }

                // Insert into database
                for (const [domaineName, specialties] of domaineMap.entries()) {
                    const domaine = await Domaine.create({
                        title: domaineName,
                        subjectId: subject.id,
                        userId: null // Official unassigned initially, or admin
                    });

                    for (const specName of specialties) {
                        await Specialite.create({
                            title: specName,
                            content: '',
                            domaineId: domaine.id
                        });
                    }
                }
            }
        }

        console.log("Seeding completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
}

seedDatabase();
