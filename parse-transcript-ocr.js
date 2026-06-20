const fs = require('fs');
const path = require('path');
const { Annexe, Subject, Domaine, Specialite } = require('./models');

async function processTranscript() {
    const transcriptPath = 'C:\\Users\\salah\\.gemini\\antigravity\\brain\\9bee2d64-988a-4265-aaeb-85861ec8b9ce\\.system_generated\\logs\\transcript.jsonl';
    
    console.log("Reading transcript...");
    const content = fs.readFileSync(transcriptPath, 'utf8');
    
    // Find the OCR text chunk
    const ocrStartIndex = content.indexOf('==Start of OCR for page 11==');
    if (ocrStartIndex === -1) {
        console.log("OCR text not found in transcript.");
        return;
    }
    
    // We only need up to page 25 or so. Let's just take a big chunk
    const ocrChunk = content.substring(ocrStartIndex, ocrStartIndex + 200000);
    
    // Unescape JSON newlines if it's within a JSON string
    // Actually, just replacing \\n with \n might be enough if it's JSON encoded
    const decodedChunk = ocrChunk.replace(/\\n/g, '\n').replace(/\\"/g, '"');
    
    const lines = decodedChunk.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Target sections
    const targets = [
        {
            keyword: 'شهادة تقني سا',
            annexeName: 'مرجع الملحق 01 (الجريدة الرسمية 2019)',
            subjectName: 'شهادة تقني سام أو شهادة الدراسات الجامعية التطبيقية'
        },
        {
            keyword: 'شهادات الليسانس',
            annexeName: 'مرجع الملحق 03 (الجريدة الرسمية 2019)',
            subjectName: 'شهادات الليسانس وشهادات الدراسات العليا'
        },
        {
            keyword: 'شهادات مهندس دولة',
            annexeName: 'مرجع الملحق 05 (الجريدة الرسمية 2019)',
            subjectName: 'شهادات مهندس دولة و شهادات الماستر'
        }
    ];

    let currentTargetIndex = -1;
    let currentDomainName = null;
    let specialtiesForDomain = [];
    
    let parsedAnnexes = [
        { title: targets[0].annexeName, subjects: [{ title: targets[0].subjectName, is_common: false, domaines: [] }] },
        { title: targets[1].annexeName, subjects: [{ title: targets[1].subjectName, is_common: false, domaines: [] }] },
        { title: targets[2].annexeName, subjects: [{ title: targets[2].subjectName, is_common: false, domaines: [] }] }
    ];

    console.log("Parsing text...");
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes(targets[0].keyword) && currentTargetIndex < 0) {
            currentTargetIndex = 0;
            continue;
        } else if (line.includes(targets[1].keyword) && currentTargetIndex < 1) {
            if (currentDomainName && currentTargetIndex >= 0) {
                parsedAnnexes[currentTargetIndex].subjects[0].domaines.push({ title: currentDomainName, specialties: specialtiesForDomain });
            }
            currentTargetIndex = 1;
            currentDomainName = null;
            specialtiesForDomain = [];
            continue;
        } else if (line.includes(targets[2].keyword) && currentTargetIndex < 2) {
            if (currentDomainName && currentTargetIndex >= 0) {
                parsedAnnexes[currentTargetIndex].subjects[0].domaines.push({ title: currentDomainName, specialties: specialtiesForDomain });
            }
            currentTargetIndex = 2;
            currentDomainName = null;
            specialtiesForDomain = [];
            continue;
        } else if (line.includes('شهادة الدراسات العليا الفنية بكل تخصصاتها') && currentTargetIndex === 2) {
            if (currentDomainName) {
                parsedAnnexes[currentTargetIndex].subjects[0].domaines.push({ title: currentDomainName, specialties: specialtiesForDomain });
            }
            currentTargetIndex = -1;
            break;
        }

        if (currentTargetIndex === -1) continue;

        if (line.startsWith('مجال') && line.includes(':')) {
            if (currentDomainName) {
                parsedAnnexes[currentTargetIndex].subjects[0].domaines.push({ title: currentDomainName, specialties: specialtiesForDomain });
            }
            currentDomainName = line.replace(':', '').trim();
            specialtiesForDomain = [];
        } 
        else if (currentDomainName && /^[0-9]+[\s\-–]+/.test(line)) {
            const specName = line.replace(/^[0-9]+[\s\-–]+/, '').trim();
            specialtiesForDomain.push({ title: specName, content: '<p>مرجع الجريدة الرسمية 2019</p>' });
        }
    }
    
    if (currentTargetIndex === 2 && currentDomainName) {
        parsedAnnexes[2].subjects[0].domaines.push({ title: currentDomainName, specialties: specialtiesForDomain });
    }

    console.log("Saving to database...");

    for (const annexeData of parsedAnnexes) {
        // Drop existing reference if exists to prevent duplicates
        const existing = await Annexe.findOne({ where: { title: annexeData.title }});
        if (existing) await existing.destroy();

        const annexe = await Annexe.create({ title: annexeData.title });
        
        for (const sub of annexeData.subjects) {
            const subject = await Subject.create({
                title: sub.title,
                is_common: sub.is_common,
                content: '',
                annexeId: annexe.id
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
        console.log(`Saved ${annexeData.title} with ${annexeData.subjects[0].domaines.length} domains.`);
    }

    console.log("Done!");
}

processTranscript().catch(console.error);
