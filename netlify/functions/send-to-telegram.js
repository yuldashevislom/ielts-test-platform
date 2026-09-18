const { prepareSubmission } = require('./lib/submission.cjs');
const reply = (statusCode, body) => ({
   statusCode,
   headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
   body: JSON.stringify(body)
});

exports.handler = async event => {
   if (event.httpMethod !== 'POST') return reply(405, { ok: false, error: 'Method not allowed' });
   let submission;
   try {
      const body = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
      if (Buffer.byteLength(body) > 300000) return reply(413, { ok: false, error: 'Javob hajmi juda katta.' });
      submission = prepareSubmission(JSON.parse(body));
   } catch (error) {
      return reply(400, { ok: false, error: error instanceof SyntaxError ? 'Noto‘g‘ri JSON.' : error.message });
   }
   const token = process.env.TELEGRAM_BOT_TOKEN;
   const chatId = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID;
   if (!token || !chatId) return reply(500, { ok: false, error: 'Telegram sozlamalari topilmadi. Administratorga murojaat qiling.' });
   try {
      let method, body, headers;
      if (submission.report.length <= 3800) {
         method = 'sendMessage'; headers = { 'Content-Type': 'application/json' };
         body = JSON.stringify({ chat_id: chatId, text: submission.report });
      } else {
         method = 'sendDocument'; body = new FormData();
         body.append('chat_id', chatId);
         body.append('caption', submission.caption);
         body.append('document', new Blob([submission.report], { type: 'text/plain;charset=utf-8' }), `${submission.examType}-answers.txt`);
      }
      const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
         method: 'POST', headers, body, signal: AbortSignal.timeout(18000)
      });
      const delivered = await response.json();
      if (!response.ok || delivered.ok !== true) {
         return reply(502, { ok: false, error: 'Telegram xabarni qabul qilmadi. Qayta urinib ko‘ring yoki administratorga murojaat qiling.' });
      }
      return reply(200, { ok: true, result: submission.result, messageId: delivered.result?.message_id });
   } catch {
      return reply(502, { ok: false, error: 'Telegram bilan bog‘lanib bo‘lmadi. Javoblaringizni qayta yuboring.' });
   }
};
