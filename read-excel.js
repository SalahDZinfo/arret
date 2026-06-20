const xlsx = require('xlsx');

try {
    const workbook = xlsx.readFile('C:\\Users\\salah\\Desktop\\annexes.xlsx');
    console.log("Sheets:", workbook.SheetNames);
    
    // Read the first few rows of the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`\nSample Data from ${firstSheetName}:`);
    for (let i = 0; i < Math.min(5, data.length); i++) {
        console.log(data[i]);
    }
} catch (e) {
    console.error("Error reading excel:", e.message);
}
