/* A submission is complete only after the server confirms Telegram delivery. */
window.sendExamSubmission = async function (submission) {
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 25000);
   try {
      const response = await fetch('/.netlify/functions/send-to-telegram', {
         method: 'POST', headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(submission), signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
         throw new Error(result.error || 'Telegramga yuborilmadi. Qayta urinib ko‘ring.');
      }
      return result;
   } catch (error) {
      if (error.name === 'AbortError') throw new Error('Server javobi kelmadi. Javoblaringiz saqlangan. Qayta yuborishingiz mumkin.');
      throw error;
   } finally { clearTimeout(timeout); }
};
