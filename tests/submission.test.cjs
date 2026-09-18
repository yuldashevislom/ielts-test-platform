const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { prepareSubmission } = require('../netlify/functions/lib/submission.cjs');
const { handler } = require('../netlify/functions/send-to-telegram.js');
const keys = require('../netlify/functions/lib/exam-keys.json');
const originalFetch = global.fetch;
const oldToken = process.env.TELEGRAM_BOT_TOKEN;
const oldChat = process.env.TELEGRAM_CHAT_ID;
afterEach(() => {
   global.fetch = originalFetch;
   if (oldToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN; else process.env.TELEGRAM_BOT_TOKEN = oldToken;
   if (oldChat === undefined) delete process.env.TELEGRAM_CHAT_ID; else process.env.TELEGRAM_CHAT_ID = oldChat;
});
const data = (type, answers = {}) => ({ examType: type, testId: `${type}-sample-v1`, name: 'Islom Test', timeUsed: 123, answers });
const request = body => ({ httpMethod: 'POST', body: JSON.stringify(body) });
for (const type of ['reading', 'listening']) {
   test(`${type}: all correct answers score 40; blank answers score 0`, () => {
      const exam = keys[type];
      const answers = Object.fromEntries(Object.entries(exam.answers).map(([key, value]) => [key, exam.types[key] === 'checkbox' ? value : Array.isArray(value) ? value[0] : value]));
      const full = prepareSubmission(data(type, answers));
      assert.equal(full.result.score, 40);
      assert.equal(full.result.results.reduce((sum, r) => sum + r.maxPoints, 0), 40);
      assert.equal(prepareSubmission(data(type)).result.score, 0);
      assert.match(full.report, /Islom Test/);
   });
}
test('Grouped answers receive partial credit and reject too many / duplicate selections', () => {
   const result = prepareSubmission(data('reading', { 'q20-21': ['B', 'D'] })).result;
   assert.equal(result.score, 1);
   assert.equal(result.results.find(r => r.question === '20-21').points, 1);
   assert.throws(() => prepareSubmission(data('reading', { 'q20-21': ['B', 'B'] })));
   assert.throws(() => prepareSubmission(data('reading', { 'q20-21': ['A', 'B', 'C'] })));
});
test('Text normalization and server-owned scores', () => {
   const result = prepareSubmission({ ...data('listening', { q2: '  SERVICE   MANAGER ' }), score: 40 }).result;
   assert.equal(result.score, 1);
});
test('Invalid requests are rejected before Telegram access', async () => {
   global.fetch = () => { throw new Error('Should not call Telegram'); };
   assert.equal((await handler({ httpMethod: 'GET' })).statusCode, 405);
   assert.equal((await handler({ httpMethod: 'POST', body: '{' })).statusCode, 400);
   assert.equal((await handler(request({ ...data('reading'), name: '' }))).statusCode, 400);
   assert.equal((await handler(request({ ...data('reading'), testId: 'old-version' }))).statusCode, 400);
   assert.equal((await handler({ httpMethod: 'POST', body: 'x'.repeat(300001) })).statusCode, 413);
});
test('Success requires Telegram ok=true, even with HTTP 200', async () => {
   process.env.TELEGRAM_BOT_TOKEN = 'test-token'; process.env.TELEGRAM_CHAT_ID = 'test-chat';
   global.fetch = async () => ({ ok: true, json: async () => ({ ok: false, description: 'denied' }) });
   assert.equal((await handler(request(data('reading')))).statusCode, 502);
   global.fetch = async () => ({ ok: true, json: async () => ({ ok: true, result: { message_id: 42 } }) });
   const response = await handler(request(data('listening', { q1: 'cousin' })));
   assert.equal(response.statusCode, 200);
   assert.equal(JSON.parse(response.body).result.score, 1);
});
test('Long Writing is delivered intact as one document', async () => {
   process.env.TELEGRAM_BOT_TOKEN = 'test-token'; process.env.TELEGRAM_CHAT_ID = 'test-chat';
   const answer = 'Essay & <text> 😀\n'.repeat(800);
   let calls = 0;
   global.fetch = async (url, options) => {
      calls++;
      assert.match(url, /\/sendDocument$/);
      assert.equal(options.body.get('chat_id'), 'test-chat');
      const report = await options.body.get('document').text();
      assert.ok(report.includes(answer.trim()));
      assert.ok(options.body.get('caption').length < 1024);
      return { ok: true, json: async () => ({ ok: true, result: { message_id: 7 } }) };
   };
   const response = await handler(request({ name: 'Test', timeUsed: 100, part1: { title: 'Task 1', answer }, part2: { title: 'Task 2', answer: 'end of writing' } }));
   assert.equal(response.statusCode, 200); assert.equal(calls, 1);
});
test('Network errors return failure without secrets', async () => {
   process.env.TELEGRAM_BOT_TOKEN = 'secret-token'; process.env.TELEGRAM_CHAT_ID = 'test-chat';
   global.fetch = async () => { throw new Error('secret-token'); };
   const response = await handler(request(data('reading')));
   assert.equal(response.statusCode, 502); assert.ok(!response.body.includes('secret-token'));
});
