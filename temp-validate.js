const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'data', 'mockQuestions.ts'), 'utf8');
const regex = /const subjectQuestionSets[\s\S]*?};\n\nexport const mockQuestions/;
const match = content.match(regex);
if (!match) {
  console.log('NO MATCH');
  process.exit(1);
}
const js = match[0].replace(/: SubjectName/g, '').replace(/Omit<MockQuestion, \"id\" \| \"subject\">\[\]/g, '[]');
const obj = eval('(' + js + ')');
const issues = [];
for (const [subject, questions] of Object.entries(obj)) {
  questions.forEach((q, i) => {
    if (!Array.isArray(q.options)) issues.push(`${subject} #${i} options not array`);
    if (typeof q.correctAnswer !== 'number') issues.push(`${subject} #${i} correctAnswer not number`);
    if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) issues.push(`${subject} #${i} correctAnswer out of range`);
    if (typeof q.question !== 'string') issues.push(`${subject} #${i} question not string`);
  });
}
console.log(issues.length ? issues.join('\n') : 'OK');
