const fs = require('fs');
const { Annexe, Exam, Subject, Domaine, Specialite } = require('./models');

async function importPdf() {
    console.log("Reading extracted text...");
    const content = fs.readFileSync('extracted.txt', 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const targets = [
        {
            keyword: 'شهادة تقني سام', // Page 12
            annexeName: 'مرجع الملحق 01 (الجريدة الرسمية 2019)',
            subjectName: 'شهادة تقني سام أو شهادة الدراسات الجامعية التطبيقية'
        },
        {
            keyword: 'شهـادات الـلـيسانس', // Page 16
            annexeName: 'مرجع الملحق 03 (الجريدة الرسمية 2019)',
            subjectName: 'شهادات الليسانس وشهادات الدراسات العليا'
        },
        {
            keyword: 'شهادات مهندس دولة', // Page 20
            annexeName: 'مرجع الملحق 05 (الجريدة الرسمية 2019)',
            subjectName: 'شهادات مهندس دولة و شهادات الماستر'
        }
    ];

    let currentTargetIndex = -1;
    let currentDomainName = null;
    let currentDomainLines = [];
    
    let parsedAnnexes = [
        { title: targets[0].annexeName, subjects: [{ title: targets[0].subjectName, is_common: false, domaines: [] }] },
        { title: targets[1].annexeName, subjects: [{ title: targets[1].subjectName, is_common: false, domaines: [] }] },
        { title: targets[2].annexeName, subjects: [{ title: targets[2].subjectName, is_common: false, domaines: [] }] }
    ];

    const saveCurrentDomain = () => {
        if (currentDomainName && currentTargetIndex >= 0) {
            // Join lines into HTML list
            const htmlContent = '<ul>' + currentDomainLines.map(l => `<li>${l}</li>`).join('') + '</ul>';
            parsedAnnexes[currentTargetIndex].subjects[0].domaines.push({
                title: currentDomainName,
                specialties: [{ title: 'التخصصات المدرجة', content: htmlContent }]
            });
        }
    };

    console.log("Parsing text...");
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes(targets[0].keyword) && currentTargetIndex < 0) {
            saveCurrentDomain();
            currentTargetIndex = 0;
            currentDomainName = null;
            continue;
        } else if (line.includes(targets[1].keyword) && currentTargetIndex < 1) {
            saveCurrentDomain();
            currentTargetIndex = 1;
            currentDomainName = null;
            continue;
        } else if (line.includes(targets[2].keyword) && currentTargetIndex < 2) {
            saveCurrentDomain();
            currentTargetIndex = 2;
            currentDomainName = null;
            continue;
        } else if (line.includes('شهادة الدراسات العليا الفنية بكل تخصصاتها') && currentTargetIndex === 2) {
            saveCurrentDomain();
            currentTargetIndex = -1;
            break; // We are done
        }

        if (currentTargetIndex === -1) continue;

        // Skip header/footer noise
        if (line.includes('اﳉريدة الرسميّة') || line.includes('ذو القعدة') || line.includes('يوليو سنة')) continue;

        if (line.startsWith('مجال')) {
            saveCurrentDomain();
            currentDomainName = line.replace(':', '').trim();
            currentDomainLines = [];
        } else if (currentDomainName) {
            // Fix standalone numbers that PyMuPDF split
            if (/^[0-9١-٩]+$/.test(line)) {
                currentDomainLines.push(line);
            } else if (line.startsWith('–') || line.startsWith('-')) {
                // merge with previous if previous is just a number
                if (currentDomainLines.length > 0 && /^[0-9١-٩]+$/.test(currentDomainLines[currentDomainLines.length - 1])) {
                    currentDomainLines[currentDomainLines.length - 1] += ' ' + line;
                } else {
                    currentDomainLines.push(line);
                }
            } else {
                currentDomainLines.push(line);
            }
        }
    }
    
    saveCurrentDomain();

    console.log("Saving to database...");

    for (const annexeData of parsedAnnexes) {
        // Find the existing annexe by matching the number (e.g., "الملحق 01")
        const keyword = annexeData.title.match(/الملحق 0[135]/)[0]; // extracts "الملحق 01", "الملحق 03", etc.
        const existingAnnexe = await Annexe.findOne({ where: { title: { [require('sequelize').Op.like]: `%${keyword}%` } } });
        
        if (!existingAnnexe) {
            console.log(`Could not find existing annexe for ${keyword}`);
            continue;
        }

        // Delete previous reference subjects in this annexe if they exist
        // Note: we now have Exam level, so we find Exam first, but let's just wipe old subjects for this exam
        let writtenExam = await Exam.findOne({ where: { annexeId: existingAnnexe.id, type: 'written' } });
        if (!writtenExam) {
            writtenExam = await Exam.create({
                title: 'الاختبارات الكتابية',
                type: 'written',
                annexeId: existingAnnexe.id
            });
        }

        const oldRefs = await Subject.findAll({ where: { examId: writtenExam.id, title: { [require('sequelize').Op.like]: '%المرجع الرسمي%' } }});
        for (const old of oldRefs) {
            await old.destroy();
        }
        
        for (const sub of annexeData.subjects) {
            const subject = await Subject.create({
                title: 'المرجع الرسمي: ' + sub.title,
                is_common: sub.is_common,
                content: '',
                examId: writtenExam.id
            });
            
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
        console.log(`Appended reference to ${existingAnnexe.title} with ${annexeData.subjects[0].domaines.length} domains.`);
        
        // Also destroy the standalone Annexes we created earlier by mistake
        const mistakeAnnexe = await Annexe.findOne({ where: { title: annexeData.title }});
        if (mistakeAnnexe) await mistakeAnnexe.destroy();
    }

    console.log("Done!");
}

importPdf().catch(console.error);
