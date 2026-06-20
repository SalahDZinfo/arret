const fs = require('fs');
const transcriptPath = 'C:\\Users\\salah\\.gemini\\antigravity\\brain\\9bee2d64-988a-4265-aaeb-85861ec8b9ce\\.system_generated\\logs\\transcript_full.jsonl';
const content = fs.readFileSync(transcriptPath, 'utf8');
const ocrStartIndex = content.indexOf('==Start of OCR for page 11==');
const ocrChunk = content.substring(ocrStartIndex, ocrStartIndex + 200000);
const decodedChunk = ocrChunk.replace(/\\n/g, '\n').replace(/\\"/g, '"');
const index = decodedChunk.indexOf('مجال البناء والأشغال العمومية');
console.log(decodedChunk.substring(index - 100, index + 300));
