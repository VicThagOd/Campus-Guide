import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanJSON(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let cleanedCount = 0;

    data.sessions.forEach(session => {
      Object.keys(session.questions).forEach(subject => {
        const originalLength = session.questions[subject].length;
        session.questions[subject] = session.questions[subject].filter(q => {
          // Remove questions with invalid answers or wrong number of options
          const hasValidAnswer = ['A', 'B', 'C', 'D'].includes(q.answer);
          const hasFourOptions = q.options.length === 4;

          if (!hasValidAnswer || !hasFourOptions) {
            console.log(`Removing ${subject} #${q.number}: ${!hasValidAnswer ? 'invalid answer' : 'wrong option count'}`);
            return false;
          }
          return true;
        });
        cleanedCount += originalLength - session.questions[subject].length;
      });
    });

    // Write back the cleaned data
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return cleanedCount;
  } catch (e) {
    console.error(`Error cleaning ${filePath}: ${e.message}`);
    return 0;
  }
}

const files = [
  'src/data/MEDICINE, PHARMACY, ANATOMY PHYSIOLOGY NURSING, DENTISTRY AND SSLT/Group1-Batch1.json',
  'src/data/MEDICINE, PHARMACY, ANATOMY PHYSIOLOGY NURSING, DENTISTRY AND SSLT/Group1-Batch2.json',
  'src/data/MEDICINE, PHARMACY, ANATOMY PHYSIOLOGY NURSING, DENTISTRY AND SSLT/Group1-Batch3.json'
];

let totalCleaned = 0;
files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  console.log(`\nCleaning ${file}:`);
  const cleaned = cleanJSON(fullPath);
  totalCleaned += cleaned;
  console.log(`Removed ${cleaned} invalid questions`);
});

console.log(`\nTotal questions cleaned: ${totalCleaned}`);