const mammoth = require('mammoth');
const cheerio = require('cheerio');

async function parseWordDocument(buffer, originalFileName) {
    try {
        const result = await mammoth.convertToHtml({ buffer: buffer });
        const html = result.value;
        const $ = cheerio.load(html);

        let annexes = [];
        let currentAnnexe = null;
        let currentSubject = null;
        let currentDomaine = null;
        let currentSpecialite = null;
        let isBuildingAnnexeTitle = false;

        $('body').children().each((i, el) => {
            const text = $(el).text().trim();
            const htmlContent = $.html(el);
            
            // Ignore completely empty paragraphs
            if (!text && !$(el).find('img').length && !$(el).find('table').length) return;

            // Check if paragraph is the start of an Annexe
            if (text.startsWith('الملحق ')) {
                currentAnnexe = {
                    title: text,
                    subjects: []
                };
                annexes.push(currentAnnexe);
                currentSubject = null;
                currentDomaine = null;
                currentSpecialite = null;
                isBuildingAnnexeTitle = true;
                return;
            }

            // If we don't have an annexe yet (e.g. single document without 'الملحق' header), create a fallback
            if (!currentAnnexe) {
                currentAnnexe = {
                    title: originalFileName.replace('.docx', '').trim(),
                    subjects: []
                };
                annexes.push(currentAnnexe);
                isBuildingAnnexeTitle = false;
            }

            // Check if paragraph is a Subject (e.g. starts with "1) اختبار" or "أ – الاختبارات")
            const isSubject = /^(?:[0-9]+\s*[)\-\.]|[أ-ي]\s*[-–])?\s*(اختبار|الاختبار|امتحان|الامتحان|محادثة)/.test(text);
            
            if (isSubject) {
                isBuildingAnnexeTitle = false; // Stop appending to annexe title once we hit the first subject
                const isTechnical = text.includes('تقني') || text.includes('التخصص') || text.includes('تخصص');
                currentSubject = { 
                    title: text, 
                    is_common: !isTechnical, 
                    content: '', 
                    domaines: [] 
                };
                currentAnnexe.subjects.push(currentSubject);
                currentDomaine = null;
                currentSpecialite = null;
            }
            // Check if paragraph starts with "مجال:"
            else if (text.startsWith('مجال:') || text.startsWith('مجال :') || text.startsWith('مجال ')) {
                isBuildingAnnexeTitle = false;
                currentDomaine = { title: text.replace(/^مجال[\s:]*/, '').trim(), specialties: [] };
                if (currentSubject && !currentSubject.is_common) {
                    currentSubject.domaines.push(currentDomaine);
                }
                currentSpecialite = null;
            } 
            // Check if paragraph starts with "التخصص:"
            else if (text.startsWith('التخصص:') || text.startsWith('تخصص:') || text.startsWith('التخصص :') || text.startsWith('تخصص :') || text.startsWith('تخصص ') || text.startsWith('التخصص ')) {
                isBuildingAnnexeTitle = false;
                currentSpecialite = { title: text.replace(/^(التخصص|تخصص)[\s:]*/, '').trim(), content: '' };
                if (currentDomaine) {
                    currentDomaine.specialties.push(currentSpecialite);
                }
            } 
            // Content belongs to current specialite, OR current subject if it's common
            else {
                if (isBuildingAnnexeTitle && text.length > 0) {
                    // This is the descriptive title right after "الملحق X"
                    currentAnnexe.title += " - " + text;
                } else if (currentSpecialite) {
                    currentSpecialite.content += htmlContent;
                } else if (currentSubject && currentSubject.is_common) {
                    currentSubject.content += htmlContent;
                }
            }
        });

        // Fallback if no subjects were found in some annexes
        annexes.forEach(annexe => {
            if (annexe.subjects.length === 0) {
                annexe.subjects.push({
                    title: 'اختبار عام',
                    is_common: true,
                    content: '<p>تم إنشاء هذا الاختبار تلقائياً لعدم العثور على مواد واضحة.</p>',
                    domaines: []
                });
            }
        });

        return annexes;
    } catch (error) {
        console.error("Error parsing document:", error);
        throw error;
    }
}

module.exports = { parseWordDocument };
