const mammoth = require('mammoth');
const fs = require('fs');

async function dump() {
    const filePath = 'c:\\Users\\salah\\Desktop\\المقرر النهائي\\AR\\ملحق 01 نهائي.docx';
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.convertToHtml({ buffer });
    fs.writeFileSync('c:\\Users\\salah\\Desktop\\المقرر النهائي\\AR\\backend\\dump.html', result.value);
    console.log('Dumped successfully');
}
dump();
