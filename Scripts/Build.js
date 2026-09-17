const assert = require('node:assert/strict');
const fileSystem = require('node:fs');
const path = require('node:path');
const { Script } = require('node:vm');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fileSystem.readFileSync(path.join(root, 'package.json'), 'utf8'));
const entryPoint = path.resolve(root, manifest.main);
assert.equal(entryPoint, path.join(root, 'Source', 'Extension.js'));
new Script(fileSystem.readFileSync(entryPoint, 'utf8'), { filename: entryPoint });

const output = path.join(root, 'Build', 'CopyTextLocation');
fileSystem.mkdirSync(path.join(output, 'Source'), { recursive: true });
// Copy only distributable files, never conversations, tests, or session logs.
for (const file of ['package.json', 'Source/Extension.js', 'README.md', 'LICENSE']) {
    fileSystem.copyFileSync(path.join(root, file), path.join(output, file));
}
console.log(`Built extension: ${output}`);
