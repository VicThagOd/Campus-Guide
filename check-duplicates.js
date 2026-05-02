import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkDuplicates(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const seen = new Set();
    let duplicates = [];

    data.sessions.forEach(session => {
      Object.entries(session.questions).forEach(([subject, questions]) => {
        questions.forEach(q => {
          const key = `${subject}-${q.question}`;
          if (seen.has(key)) {
            duplicates.push(`${subject} #${q.number}: "${q.question.substring(0, 50)}..."`);
          } else {
            seen.add(key);
          }
        });
      });
    });

    return duplicates;
  } catch (e) {
    return [`Parse error: ${e.message}`];
  }
}

const files = [
  'src/data/MEDICINE, PHARMACY, ANATOMY PHYSIOLOGY NURSING, DENTISTRY AND SSLT/Group1-Batch1.json',
  'src/data/MEDICINE, PHARMACY, ANATOMY PHYSIOLOGY NURSING, DENTISTRY AND SSLT/Group1-Batch2.json',
  'src/data/MEDICINE, PHARMACY, ANATOMY PHYSIOLOGY NURSING, DENTISTRY AND SSLT/Group1-Batch3.json'
];

let totalDuplicates = 0;
files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  console.log(`\nChecking duplicates in ${file}:`);
  const duplicates = checkDuplicates(fullPath);
  if (duplicates.length === 0) {
    console.log('✓ No duplicates found');
  } else {
    duplicates.forEach(dup => console.log('✗ ' + dup));
    totalDuplicates += duplicates.length;
  }
});

console.log(`\nTotal duplicate questions: ${totalDuplicates}`);