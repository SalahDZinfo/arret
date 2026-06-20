const xlsx = require('xlsx');

const excelPath = 'C:\\Users\\salah\\Desktop\\annexes.xlsx';
const workbook = xlsx.readFile(excelPath);

['ملحق01', 'ملحق02'].forEach(sheetName => {
    console.log(`\n--- ${sheetName} ---`);
    if (!workbook.SheetNames.includes(sheetName)) {
        console.log('Not found');
        return;
    }
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log("Headers:", rows[0]);
    for(let i=1; i<Math.min(5, rows.length); i++) {
        console.log(`Row ${i}:`, rows[i]);
    }
});
