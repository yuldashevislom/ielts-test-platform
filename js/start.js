const startForm = document.getElementById('startForm');
const userNameInput = document.getElementById('userName');
const startMessage = document.getElementById('startMessage');
const adminBtn = document.getElementById('adminBtn');
const examTypeInput = document.getElementById('examType');

// Existing Writing admin flow. This UI password is not server authentication.
adminBtn.addEventListener('click', () => {
   const password = prompt('Admin parolini kiriting');
   if (password === '12345') window.location.href = './admin.html';
   else if (password !== null) alert("Noto'g'ri parol");
});
const savedUser = getFromStorage(STORAGE_KEYS.currentUser);
if (savedUser?.name) userNameInput.value = savedUser.name;

startForm.addEventListener('submit', async (event) => {
   event.preventDefault();
   const name = userNameInput.value.trim();
   const examType = examTypeInput.value;
   const button = startForm.querySelector('button[type="submit"]');
   startMessage.textContent = '';
   if (!name) { startMessage.textContent = 'Iltimos, ism va familiyangizni kiriting.'; return; }
   button.disabled = true;
   try {
      if (examType === 'writing') {
         const response = await fetch('/.netlify/functions/get-task');
         const task = await response.json();
         if (!response.ok || !task?.part1 || !task?.part2 || !(task.duration > 0)) {
            throw new Error('Writing task topilmadi. Admin panelida task yarating.');
         }
      }
      const previous = getFromStorage(STORAGE_KEYS.currentUser);
      if (previous?.name !== name) removeFromStorage(STORAGE_KEYS.writingDraft);
      if (examType !== 'writing') removeFromStorage(`ieltsResult:${examType}-sample-v1:${name}`);
      saveToStorage(STORAGE_KEYS.currentUser, { name });
      window.location.href = examType === 'writing' ? './exam.html' : `./${examType}.html`;
   } catch (error) {
      startMessage.textContent = error.message || 'Testni ochib bo‘lmadi. Internetni tekshiring.';
      startMessage.className = 'message danger';
      button.disabled = false;
   }
});
