const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
// Publish browser assets only; server answer keys and tests stay private.
for (const entry of fs.readdirSync(root)) {
   if (entry.endsWith('.html') || ['css', 'js'].includes(entry)) {
      fs.cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
   }
}
console.log('Static assets prepared in public/');
