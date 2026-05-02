import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateJSON(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let issues = [];

    data.sessions.forEach(session => {
      Object.entries(session.questions).forEach(([subject, questions]) => {
        questions.forEach((q, i) => {
          // Check if answer is valid A, B, C, D
          if (!['A', 'B', 'C', 'D'].includes(q.answer)) {
            issues.push(`${subject} #${q.number}: invalid answer '${q.answer}'`);
          }
          // Check if options array has 4 items
          if (q.options.length !== 4) {
            issues.push(`${subject} #${q.number}: ${q.options.length} options instead of 4`);
          }
        });
      });
    });

    return issues;
  } catch (e) {
    return [`Parse error: ${e.message}`];
  }
}

const files = [
  'src/data/MEDICINE, PHARMACY, ANATOMY PHYSIOLOGY NURSING, DENTISTRY AND SSLT/Group1-Batch1.json',
  'src/data/MEDICINE, PHARMACY, ANATOMY PHYSIOLOGY NURSING, DENTISTRY AND SSLT/Group1-Batch2.json',
  'src/data/MEDICINE, PHARMACY, ANATOMY PHYSIOLOGY NURSING, DENTISTRY AND SSLT/Group1-Batch3.json'
];

files.forEach(file => {
  console.log(`\nValidating ${file}:`);
  const issues = validateJSON(path.join(__dirname, file));
  if (issues.length === 0) {
    console.log('✓ No issues found');
  } else {
    issues.forEach(issue => console.log('✗ ' + issue));
  }
});