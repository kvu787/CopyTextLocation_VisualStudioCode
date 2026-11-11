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
// Copy the same files the VSIX contains: vsce always packages package.json and README.md,
// and the manifest's "files" allowlist names everything else.
for (const file of ['package.json', 'README.md', ...manifest.files]) {
    const destination = path.join(output, file);
    fileSystem.mkdirSync(path.dirname(destination), { recursive: true });
    fileSystem.copyFileSync(path.join(root, file), destination);
}
console.log(`Built extension: ${output}`);
