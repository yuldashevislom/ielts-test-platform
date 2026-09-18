const user = getFromStorage(STORAGE_KEYS.currentUser);

const titleEl = document.getElementById("taskTitle");
const instructionEl = document.getElementById("taskInstruction");
const questionEl = document.getElementById("taskQuestion");
const imageEl = document.getElementById("taskImage");

const userNameEl = document.getElementById("userName");
const timerEl = document.getElementById("timer");

const answerBox = document.getElementById("answerBox");
const wordCountEl = document.getElementById("wordCount");
const wordWarningEl = document.getElementById("wordWarning");
const saveStatusEl = document.getElementById("saveStatus");

const part1TabBtn = document.getElementById("part1TabBtn");
const part2TabBtn = document.getElementById("part2TabBtn");
const submitBtn = document.getElementById("submitBtn");

let task = null;
let activePart = 1;
let timeLeft = 0;
let timerInterval;
let saveStatusTimeout = null;
let submitting = false;
let pendingSubmission = null;
let deadline = 0;

initExam();

async function initExam() {
   if (!user) {
      alert("User ma'lumoti topilmadi");
      window.location.href = "./index.html";
      return;
   }

   task = await getTaskFromServer();

   if (!task) {
      alert("Task topilmadi. Iltimos admin panelda task yarating.");
      window.location.href = "./index.html";
      return;
   }

   userNameEl.textContent = user.name;

   let savedDraft = getFromStorage(STORAGE_KEYS.writingDraft);
   if (savedDraft && savedDraft.name !== user.name) {
      removeFromStorage(STORAGE_KEYS.writingDraft); savedDraft = null;
   }
   pendingSubmission = savedDraft?.pendingSubmission || null;

   if (savedDraft && typeof savedDraft.remaining === "number") {
      timeLeft = savedDraft.remaining;
   } else {
      timeLeft = task.duration * 60;
   }

   deadline = savedDraft?.deadline || Date.now() + timeLeft * 1000;
   timeLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
   renderCurrentPart();
   loadCurrentAnswer();
   updateWordInfo(answerBox.value);
   updateTimerDisplay();
   if (pendingSubmission) {
      answerBox.disabled = true;
      submitBtn.textContent = 'Qayta yuborish';
      saveStatusEl.textContent = 'Yuborilmagan javoblaringiz saqlangan. Qayta yuborish tugmasini bosing.';
   } else { saveCurrentPartDraft(); startTimer(); }
}

async function getTaskFromServer() {
   try {
      const response = await fetch("/.netlify/functions/get-task");
      const task = await response.json();
      return response.ok && task?.part1 && task?.part2 && task.duration > 0 ? task : null;
   } catch (error) {
      console.log("Get task error:", error);
      return null;
   }
}

function getDraft() {
   const savedDraft = getFromStorage(STORAGE_KEYS.writingDraft);

   return savedDraft || {
      part1: "",
      part2: "",
      remaining: task.duration * 60
   };
}

function showSaveStatus(text) {
   saveStatusEl.textContent = text;

   if (saveStatusTimeout) {
      clearTimeout(saveStatusTimeout);
   }

   saveStatusTimeout = setTimeout(() => {
      saveStatusEl.textContent = "Saved ✓";
   }, 700);
}

function saveCurrentPartDraft() {
   if (pendingSubmission || !task) return;
   const draft = getDraft();

   if (activePart === 1) {
      draft.part1 = answerBox.value;
   } else {
      draft.part2 = answerBox.value;
   }

   draft.name = user.name;
   draft.deadline = deadline;
   draft.remaining = timeLeft;

   saveToStorage(STORAGE_KEYS.writingDraft, draft);
   showSaveStatus("Saving...");
}

function loadCurrentAnswer() {
   const draft = getDraft();

   if (activePart === 1) {
      answerBox.value = draft.part1 || "";
   } else {
      answerBox.value = draft.part2 || "";
   }
}

function renderCurrentPart() {
   const currentPart = activePart === 1 ? task.part1 : task.part2;

   titleEl.textContent = currentPart.title;
   instructionEl.textContent = currentPart.instruction;
   questionEl.textContent = currentPart.question;

   if (currentPart.image) {
      imageEl.src = currentPart.image;
      imageEl.style.display = "block";
   } else {
      imageEl.removeAttribute("src");
      imageEl.style.display = "none";
   }

   part1TabBtn.classList.toggle("active-part-btn", activePart === 1);
   part2TabBtn.classList.toggle("active-part-btn", activePart === 2);
}

function switchPart(partNumber) {
   saveCurrentPartDraft();

   activePart = partNumber;

   renderCurrentPart();
   loadCurrentAnswer();
   updateWordInfo(answerBox.value);
}

function updateWordInfo(text) {
   const trimmedText = text.trim();
   const words = trimmedText === "" ? 0 : trimmedText.split(/\s+/).length;

   const minWords = activePart === 1 ? 150 : 250;

   wordCountEl.textContent = `Words: ${words}`;

   if (words < minWords) {
      wordWarningEl.textContent = `⚠ Recommended minimum: ${minWords} words`;
      wordWarningEl.style.color = "#ef4444";
   } else {
      wordWarningEl.textContent = "✔ Good length";
      wordWarningEl.style.color = "#22c55e";
   }
}

function updateTimerDisplay() {
   const minutes = Math.floor(timeLeft / 60);
   const seconds = timeLeft % 60;

   timerEl.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function startTimer() {
   timerInterval = setInterval(() => {
      timeLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

      if (timeLeft < 0) {
         timeLeft = 0;
      }

      const draft = getDraft();
      draft.remaining = timeLeft;
      saveToStorage(STORAGE_KEYS.writingDraft, draft);

      updateTimerDisplay();

      if (timeLeft <= 0) {
         clearInterval(timerInterval);
         submitExam(true);
      }
   }, 1000);
}

answerBox.addEventListener("input", () => {
   updateWordInfo(answerBox.value);
   saveCurrentPartDraft();
});

part1TabBtn.addEventListener("click", () => {
   switchPart(1);
});

part2TabBtn.addEventListener("click", () => {
   switchPart(2);
});

submitBtn.addEventListener("click", () => {
   submitExam(false);
});

async function submitExam(auto = false) {
   if (submitting || !task) return;
   submitting = true;
   clearInterval(timerInterval);
   clearTimeout(saveStatusTimeout);
   saveCurrentPartDraft();
   clearTimeout(saveStatusTimeout);
   const draft = getDraft();
   if (!pendingSubmission) {
      pendingSubmission = {
         submissionId: crypto.randomUUID(), examType: 'writing',
         name: user.name, autoSubmitted: auto,
         timeUsed: Math.max(0, task.duration * 60 - timeLeft), taskDuration: task.duration,
         part1: { title: task.part1.title, answer: draft.part1 || '' },
         part2: { title: task.part2.title, answer: draft.part2 || '' }
      };
      draft.name = user.name;
      draft.pendingSubmission = pendingSubmission;
      saveToStorage(STORAGE_KEYS.writingDraft, draft);
   }
   answerBox.disabled = true;
   submitBtn.disabled = true;
   submitBtn.textContent = 'Yuborilmoqda…';
   saveStatusEl.textContent = 'Telegramga yuborilmoqda…';
   try {
      await window.sendExamSubmission(pendingSubmission);
      saveToStorage(STORAGE_KEYS.lastSubmission, pendingSubmission);
      removeFromStorage(STORAGE_KEYS.writingDraft);
      window.location.href = './result.html';
   } catch (error) {
      saveStatusEl.textContent = `${error.message} Javoblaringiz saqlangan.`;
      submitBtn.textContent = 'Qayta yuborish';
      submitBtn.disabled = false;
   } finally { submitting = false; }
}
