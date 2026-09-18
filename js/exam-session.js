(() => {
   'use strict';
   const user = getFromStorage(STORAGE_KEYS.currentUser);
   if (!user?.name) { location.replace('./index.html'); return; }
   const examType = document.body.dataset.examType;
   const testId = document.body.dataset.testId;
   const duration = Number(document.body.dataset.duration) * 60;
   const draftKey = `ieltsDraft:${testId}:${user.name}`;
   const resultKey = `ieltsResult:${testId}:${user.name}`;
   const inputs = [...document.querySelectorAll('.answer-input, input[type="radio"], input[type="checkbox"]')];
   let draft = getFromStorage(draftKey);
   const previousResult = !draft ? getFromStorage(resultKey) : null;
   if (!draft || !Number.isFinite(draft.deadline)) {
      draft = { id: crypto.randomUUID(), deadline: Date.now() + duration * 1000, answers: {} };
   }
   let busy = false;
   let completed = false;
   let interval;
   document.getElementById('candidate-name').textContent = user.name;
   const modal = document.getElementById('result-modal');
   const status = document.createElement('div');
   status.id = 'submission-status';
   status.setAttribute('role', 'status');
   document.getElementById('score-summary').insertAdjacentElement('afterend', status);
   const home = document.createElement('a');
   home.href = './index.html'; home.textContent = '← Bosh sahifaga qaytish';
   document.getElementById('result-details').insertAdjacentElement('afterend', home);

   function collectAnswers() {
      const answers = {};
      inputs.forEach(input => {
         const key = input.name || input.id;
         if (!/^q\d+(?:-\d+)?$/.test(key)) return;
         if (input.type === 'checkbox') {
            if (!answers[key]) answers[key] = [];
            if (input.checked) answers[key].push(input.value);
         } else if (input.type === 'radio') {
            if (input.checked) answers[key] = input.value;
         } else answers[key] = input.value.trim();
      });
      return answers;
   }
   function persist() {
      if (!draft.pending) draft.answers = collectAnswers();
      saveToStorage(draftKey, draft);
   }
   function restore() {
      inputs.forEach(input => {
         const value = draft.answers[input.name || input.id];
         if (input.type === 'checkbox') input.checked = Array.isArray(value) && value.includes(input.value);
         else if (input.type === 'radio') input.checked = value === input.value;
         else input.value = typeof value === 'string' ? value : '';
      });
      // Restore each group limit as well as its navigation indicators.
      inputs.filter(input => input.type === 'checkbox' && input.checked).forEach(input => input.dispatchEvent(new Event('change')));
      updateAnsweredIndicators();
   }
   function lockAnswers() {
      inputs.forEach(input => { input.disabled = true; });
      document.getElementById('global-audio-player')?.pause();
   }
   function setStatus(message, failed = false) {
      status.className = failed ? 'error' : '';
      status.replaceChildren(document.createTextNode(message));
      if (failed) {
         const retry = document.createElement('button');
         retry.textContent = 'Qayta yuborish';
         retry.addEventListener('click', () => submit());
         status.append(document.createElement('br'), retry);
      }
   }
   function showResult(result) {
      document.getElementById('score-summary').textContent = `${user.name}: ${result.score} / ${result.total}`;
      setStatus('Javoblaringiz Telegramga yuborildi.');
      const table = document.createElement('table');
      const row = table.insertRow();
      ['Question', 'Your answer', 'Correct answer', 'Points'].forEach(label => {
         const th = document.createElement('th'); th.textContent = label; row.appendChild(th);
      });
      result.results.forEach(item => {
         const row = table.insertRow();
         [item.question, item.userAnswer || 'No answer', item.correctAnswer, `${item.points}/${item.maxPoints}`]
            .forEach(text => { row.insertCell().textContent = text; });
      });
      document.getElementById('result-details').replaceChildren(table);
      inputs.forEach(input => {
         const key = input.name || input.id;
         const item = result.results.find(r => `q${r.question}` === key);
         if (item) input.classList.add(item.points === item.maxPoints ? 'correct' : 'incorrect');
      });
      const button = document.getElementById('deliver-button');
      button.textContent = 'My Results'; button.disabled = false;
      modal.style.display = 'flex';
   }
   async function submit(auto = false) {
      if (busy || completed) return;
      busy = true;
      clearInterval(interval);
      if (!draft.pending) {
         draft.answers = collectAnswers();
         draft.pending = {
            submissionId: draft.id, examType, testId, name: user.name,
            timeUsed: Math.min(duration, Math.max(0, duration - Math.ceil((draft.deadline - Date.now()) / 1000))),
            autoSubmitted: auto, answers: draft.answers
         };
      }
      persist(); lockAnswers();
      document.getElementById('deliver-button').disabled = true;
      document.getElementById('confirm-submit-modal').style.display = 'none';
      document.getElementById('score-summary').textContent = 'Test yakunlandi';
      setStatus('Javoblar yuborilmoqda…'); modal.style.display = 'flex';
      try {
         const response = await window.sendExamSubmission(draft.pending);
         completed = true;
         saveToStorage(resultKey, { submission: draft.pending, result: response.result });
         removeFromStorage(draftKey);
         showResult(response.result);
      } catch (error) {
         setStatus(`${error.message} Javoblaringiz shu brauzerda saqlangan.`, true);
         document.getElementById('deliver-button').disabled = false;
         document.getElementById('deliver-button').textContent = 'Qayta yuborish';
      } finally { busy = false; }
   }
   // Handle pending/success states before the original template's submit listener.
   document.getElementById('deliver-button').addEventListener('click', event => {
      if (completed || draft.pending) {
         event.stopImmediatePropagation();
         modal.style.display = 'flex';
      }
   }, true);
   function tick() {
      const remaining = Math.max(0, Math.ceil((draft.deadline - Date.now()) / 1000));
      document.getElementById('exam-countdown').textContent = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
      if (!remaining) submit(true);
   }
   inputs.forEach(input => {
      input.addEventListener('input', persist);
      input.addEventListener('change', persist);
   });
   window.addEventListener('beforeunload', event => {
      if (!completed) { persist(); event.preventDefault(); event.returnValue = ''; }
   });
   window.ExamSession = { submit };
   setupCheckboxLimits();
   if (previousResult?.result && previousResult?.submission) {
      draft.answers = previousResult.submission.answers;
      restore(); removeFromStorage(draftKey); completed = true; lockAnswers(); showResult(previousResult.result);
      document.getElementById('exam-countdown').textContent = 'Finished';
      return;
   }
   restore(); persist();
   if (draft.pending) {
      lockAnswers(); modal.style.display = 'flex';
      document.getElementById('score-summary').textContent = 'Yuborilmagan javoblar';
      setStatus('Avvalgi javoblaringiz saqlangan. Yuborishni qayta urinib ko‘ring.', true);
   } else {
      interval = setInterval(tick, 1000); tick();
   }
})();
