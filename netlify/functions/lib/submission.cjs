const exams = require('./exam-keys.json');
const normalize = value => value.trim().replace(/\s+/g, ' ').toLowerCase();

function text(value, field, max, fallback = '') {
   if (value === undefined) return fallback;
   if (typeof value !== 'string' || value.length > max) throw new Error(`${field}: noto‘g‘ri qiymat.`);
   return value.trim();
}
function prepareSubmission(data) {
   if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Noto‘g‘ri so‘rov.');
   const name = text(data.name, 'FIO', 120);
   if (!name) throw new Error('FIO kiritilishi shart.');
   const examType = data.examType || 'writing'; // Backward compatible with Writing clients.
   if (!['writing', 'reading', 'listening'].includes(examType)) throw new Error('Test turi noto‘g‘ri.');
   const timeUsed = data.timeUsed === undefined ? 0 : data.timeUsed;
   if (!Number.isFinite(timeUsed) || timeUsed < 0 || timeUsed > 86400) throw new Error('Vaqt noto‘g‘ri.');
   const submissionId = text(data.submissionId, 'Submission ID', 100, 'legacy');
   const title = examType[0].toUpperCase() + examType.slice(1);
   const header = `${title} Exam Result\n\nFIO: ${name}\nSarflangan vaqt: ${Math.floor(timeUsed)} seconds\nAuto submitted: ${data.autoSubmitted === true ? 'Yes' : 'No'}\nSubmission ID: ${submissionId}`;
   let report = header;
   let result = null;
   if (examType === 'writing') {
      for (const key of ['part1', 'part2']) {
         const part = data[key];
         if (!part || typeof part !== 'object') throw new Error(`${key} topilmadi.`);
         const partTitle = text(part.title, 'Part title', 500, key);
         const answer = text(part.answer, 'Writing answer', 100000);
         report += `\n\n${partTitle}\nWords: ${answer ? answer.split(/\s+/).length : 0}\n\n${answer || 'Javob yozilmagan.'}`;
      }
   } else {
      if (data.testId !== exams[examType].testId) throw new Error('Test versiyasi topilmadi. Bosh sahifadan qayta kiring.');
      if (!data.answers || typeof data.answers !== 'object' || Array.isArray(data.answers)) throw new Error('Javoblar noto‘g‘ri.');
      const exam = exams[examType];
      let score = 0;
      const results = Object.entries(exam.answers).map(([key, correct]) => {
         const checkbox = exam.types[key] === 'checkbox';
         let userAnswer, points, maxPoints;
         if (checkbox) {
            const selected = data.answers[key] ?? [];
            if (!Array.isArray(selected) || selected.length > correct.length || selected.some(v => typeof v !== 'string' || !/^[A-Z]$/.test(v)) || new Set(selected).size !== selected.length) {
               throw new Error(`${key}: tanlovlar noto‘g‘ri.`);
            }
            userAnswer = selected.join(', ');
            points = selected.filter(v => correct.includes(v)).length;
            maxPoints = correct.length;
         } else {
            userAnswer = text(data.answers[key], key, 500);
            points = (Array.isArray(correct) ? correct : [correct]).some(value => normalize(value) === normalize(userAnswer)) ? 1 : 0;
            maxPoints = 1;
         }
         score += points;
         return { question: key.slice(1), userAnswer,
            correctAnswer: Array.isArray(correct) ? correct.join(checkbox ? ', ' : ' / ') : correct,
            points, maxPoints };
      });
      result = { score, total: 40, results };
      report += `\nTest: ${data.testId}\nNatija: ${score}/40\n\nJAVOBLAR\n`;
      results.forEach(row => {
         report += `\n${row.question}. ${row.userAnswer || 'Javob yozilmagan.'}\nTo‘g‘ri javob: ${row.correctAnswer} | Ball: ${row.points}/${row.maxPoints}\n`;
      });
   }
   const caption = header + (result ? `\nNatija: ${result.score}/40` : '') + '\n\nBarcha javoblar faylda.';
   return { examType, submissionId, report, caption, result };
}
module.exports = { prepareSubmission };
