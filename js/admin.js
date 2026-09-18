const taskForm = document.getElementById("taskForm");

const part1TitleInput = document.getElementById("part1Title");
const part1InstructionInput = document.getElementById("part1Instruction");
const part1QuestionInput = document.getElementById("part1Question");
const part1ImageInput = document.getElementById("part1Image");

const part2TitleInput = document.getElementById("part2Title");
const part2InstructionInput = document.getElementById("part2Instruction");
const part2QuestionInput = document.getElementById("part2Question");
const part2ImageInput = document.getElementById("part2Image");

const durationInput = document.getElementById("duration");
const clearTaskBtn = document.getElementById("clearTaskBtn");
const messageBox = document.getElementById("message");
const previewContent = document.getElementById("previewContent");

let selectedPart1ImageBase64 = "";
let selectedPart2ImageBase64 = "";

initAdmin();

async function initAdmin() {
   await loadTaskIntoForm();
   await renderPreview();
}

function showMessage(text, type = "success") {
   messageBox.textContent = text;
   messageBox.className = `message ${type}`;
}

async function getTaskFromServer() {
   try {
      const response = await fetch("/.netlify/functions/get-task");
      const task = await response.json();
      return task;
   } catch (error) {
      console.log("Get task error:", error);
      return null;
   }
}

async function saveTaskToServer(task) {
   const response = await fetch("/.netlify/functions/save-task", {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify(task)
   });

   const result = await response.json();
   return result;
}

async function clearTaskFromServer() {
   const response = await fetch("/.netlify/functions/save-task", {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify(null)
   });

   const result = await response.json();
   return result;
}

async function renderPreview() {
   const savedTask = await getTaskFromServer();

   if (!savedTask) {
      previewContent.innerHTML = `<p>Task hali saqlanmadi.</p>`;
      return;
   }

   previewContent.innerHTML = `
      <h3>Part 1</h3>
      <p><strong>Title:</strong> ${savedTask.part1.title}</p>
      <p><strong>Instruction:</strong> ${savedTask.part1.instruction}</p>
      <p><strong>Question:</strong> ${savedTask.part1.question}</p>
      ${savedTask.part1.image
         ? `<img src="${savedTask.part1.image}" alt="Part 1 Image" class="preview-image" />`
         : `<p><strong>Image:</strong> Rasm yuklanmadi</p>`
      }

      <hr style="margin:20px 0;">

      <h3>Part 2</h3>
      <p><strong>Title:</strong> ${savedTask.part2.title}</p>
      <p><strong>Instruction:</strong> ${savedTask.part2.instruction}</p>
      <p><strong>Question:</strong> ${savedTask.part2.question}</p>
      ${savedTask.part2.image
         ? `<img src="${savedTask.part2.image}" alt="Part 2 Image" class="preview-image" />`
         : `<p><strong>Image:</strong> Rasm yuklanmadi</p>`
      }

      <hr style="margin:20px 0;">

      <p><strong>Total Duration:</strong> ${savedTask.duration} minutes</p>
   `;
}

async function loadTaskIntoForm() {
   const savedTask = await getTaskFromServer();

   if (!savedTask) return;

   part1TitleInput.value = savedTask.part1?.title || "";
   part1InstructionInput.value = savedTask.part1?.instruction || "";
   part1QuestionInput.value = savedTask.part1?.question || "";
   selectedPart1ImageBase64 = savedTask.part1?.image || "";

   part2TitleInput.value = savedTask.part2?.title || "";
   part2InstructionInput.value = savedTask.part2?.instruction || "";
   part2QuestionInput.value = savedTask.part2?.question || "";
   selectedPart2ImageBase64 = savedTask.part2?.image || "";

   durationInput.value = savedTask.duration || 60;
}

function handleImageChange(inputElement, callback) {
   inputElement.addEventListener("change", function (event) {
      const file = event.target.files[0];

      if (!file) {
         callback("");
         return;
      }

      const reader = new FileReader();

      reader.onload = function () {
         callback(reader.result);
      };

      reader.readAsDataURL(file);
   });
}

handleImageChange(part1ImageInput, function (result) {
   selectedPart1ImageBase64 = result;
});

handleImageChange(part2ImageInput, function (result) {
   selectedPart2ImageBase64 = result;
});

taskForm.addEventListener("submit", async function (event) {
   event.preventDefault();

   const task = {
      duration: Number(durationInput.value),
      part1: {
         title: part1TitleInput.value.trim(),
         instruction: part1InstructionInput.value.trim(),
         question: part1QuestionInput.value.trim(),
         image: selectedPart1ImageBase64,
         minWords: 150
      },
      part2: {
         title: part2TitleInput.value.trim(),
         instruction: part2InstructionInput.value.trim(),
         question: part2QuestionInput.value.trim(),
         image: selectedPart2ImageBase64,
         minWords: 250
      }
   };

   try {
      await saveTaskToServer(task);
      showMessage("Task saqlandi!");
      await renderPreview();
   } catch (error) {
      console.log("Save task error:", error);
      showMessage("Taskni saqlashda xatolik yuz berdi.", "danger");
   }
});

clearTaskBtn.addEventListener("click", async function () {
   try {
      await clearTaskFromServer();

      removeFromStorage(STORAGE_KEYS.writingDraft);
      removeFromStorage(STORAGE_KEYS.lastSubmission);

      taskForm.reset();
      durationInput.value = 60;

      selectedPart1ImageBase64 = "";
      selectedPart2ImageBase64 = "";

      previewContent.innerHTML = `<p>Task hali saqlanmadi.</p>`;

      showMessage("Task tozalandi.", "danger");
   } catch (error) {
      console.log("Clear task error:", error);
      showMessage("Taskni tozalashda xatolik yuz berdi.", "danger");
   }
});