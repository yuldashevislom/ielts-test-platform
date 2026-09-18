const submission = getFromStorage(STORAGE_KEYS.lastSubmission);

const userEl = document.getElementById("resultUser");
const timeEl = document.getElementById("resultTime");
const autoEl = document.getElementById("resultAuto");

const part1TitleEl = document.getElementById("resultPart1Title");
const part1AnswerEl = document.getElementById("resultPart1Answer");

const part2TitleEl = document.getElementById("resultPart2Title");
const part2AnswerEl = document.getElementById("resultPart2Answer");

const backBtn = document.getElementById("backBtn");

initResult();

function initResult() {
   if (!submission) {
      alert("Yuborilgan ish topilmadi.");
      window.location.href = "./index.html";
      return;
   }

   userEl.textContent = submission.name;
   timeEl.textContent = submission.timeUsed;

   autoEl.textContent = submission.autoSubmitted ? "Yes" : "No";

   part1TitleEl.textContent = submission.part1?.title || "Part 1";
   part1AnswerEl.textContent = submission.part1?.answer || "Javob yozilmagan.";

   part2TitleEl.textContent = submission.part2?.title || "Part 2";
   part2AnswerEl.textContent = submission.part2?.answer || "Javob yozilmagan.";
}

backBtn.addEventListener("click", () => {
   removeFromStorage(STORAGE_KEYS.currentUser);
   window.location.href = "./index.html";
});