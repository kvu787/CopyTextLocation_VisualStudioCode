const assert = require('node:assert/strict');
const fileSystem = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fileSystem.readFileSync(path.join(__dirname, '../Source/Extension.js'), 'utf8');
const note = 'Lines and columns are 1-based; columns count UTF-16 code units '
    + '(a tab counts as one unit). Start inclusive, end exclusive.';

function createEditor(text = 'Hello', filePath = 'C:\\Project\\Example.cs') {
    const selection = {
        start: { line: 11, character: 4 },
        end: { line: 11, character: 9 },
        isEmpty: false
    };
    return {
        selection,
        document: {
            isUntitled: false,
            uri: { scheme: 'file', fsPath: filePath, path: '/deliberately/different' },
            getText(range) {
                assert.equal(range, selection, 'Read exactly the primary selection');
                return text;
            }
        }
    };
}

function activate(editor = createEditor(), writeText) {
    const state = { clipboard: 'Existing clipboard', warnings: [], errors: [], subscriptions: [] };
    const vscode = {
        window: {
            activeTextEditor: editor,
            showWarningMessage: message => state.warnings.push(message),
            showErrorMessage: message => state.errors.push(message)
        },
        env: { clipboard: { writeText: writeText || (async text => { state.clipboard = text; }) } },
        commands: {
            registerCommand(command, callback) {
                state.command = command;
                state.execute = callback;
                return { dispose() {} };
            }
        }
    };
    const context = {
        module: { exports: {} },
        Error,
        require(name) {
            assert.equal(name, 'vscode');
            return vscode;
        }
    };
    vm.runInNewContext(source, context, { filename: 'Extension.js' });
    context.module.exports.activate(state);
    state.window = vscode.window;
    return state;
}

test('registers the contributed command and disposes it with the extension', () => {
    const state = activate();
    const manifest = require('../package.json');
    assert.equal(state.command, manifest.contributes.commands[0].command);
    assert.equal(manifest.contributes.commands[0].title, 'Copy text and location');
    assert.equal(manifest.contributes.menus['editor/context'][0].command, state.command);
    assert.equal(state.subscriptions.length, 1);
    assert.equal(typeof state.subscriptions[0].dispose, 'function');
});

test('copies the complete single-line payload, including both endpoints', async () => {
    const state = activate();
    await state.execute();
    assert.equal(state.clipboard, `C:\\Project\\Example.cs:12:5-12:10\n${note}\n\nHello`);
});

for (const filePath of [
    '/home/user/Project/Example.cs',
    '/Users/user/Project/Example.cs',
    'C:\\Project with spaces\\日本語 #%.txt',
    '\\\\server\\share\\Example.cs',
    '/home/user/literal\\backslash.txt'
]) {
    test(`uses the filesystem path unchanged: ${filePath}`, async () => {
        const state = activate(createEditor('Hello', filePath));
        await state.execute();
        assert.equal(state.clipboard, `${filePath}:12:5-12:10\n${note}\n\nHello`);
    });
}

for (const selectedText of ['  \tHello  ', 'first\nsecond\n', 'first\r\nsecond\r\n', '\t😀e\u0301', '```\n<>&\\\n```', '\n']) {
    test(`preserves the selection verbatim: ${JSON.stringify(selectedText)}`, async () => {
        const state = activate(createEditor(selectedText));
        await state.execute();
        assert.equal(state.clipboard.slice(state.clipboard.indexOf('\n\n') + 2), selectedText);
    });
}

test('uses ordered multiline endpoints even for a reversed selection', async () => {
    const editor = createEditor('first\nsecond');
    editor.selection.end = { line: 14, character: 8 };
    editor.selection.anchor = editor.selection.end;
    editor.selection.active = editor.selection.start;
    const state = activate(editor);
    await state.execute();
    assert.equal(state.clipboard.split('\n')[0], 'C:\\Project\\Example.cs:12:5-15:9');
});

test('keeps an exclusive endpoint at the beginning of the following line', async () => {
    const editor = createEditor('Hello\r\n');
    editor.selection.end = { line: 12, character: 0 };
    const state = activate(editor);
    await state.execute();
    assert.equal(state.clipboard, `C:\\Project\\Example.cs:12:5-13:1\n${note}\n\nHello\r\n`);
});

test('copies the primary selection when multiple selections exist', async () => {
    const editor = createEditor();
    editor.selections = [editor.selection, { start: { line: 20, character: 0 } }];
    const state = activate(editor);
    await state.execute();
    assert.equal(state.clipboard, `C:\\Project\\Example.cs:12:5-12:10\n${note}\n\nHello`);
});

test('copies remote files using their filesystem paths', async () => {
    const editor = createEditor('Hello', '/work/Example.cs');
    editor.document.uri.scheme = 'vscode-remote';
    const state = activate(editor);
    await state.execute();
    assert.equal(state.clipboard, `/work/Example.cs:12:5-12:10\n${note}\n\nHello`);
});

for (const scenario of ['no editor', 'empty selection', 'untitled document', 'virtual document']) {
    test(`${scenario} leaves the clipboard unchanged and explains why`, async () => {
        const editor = createEditor();
        if (scenario === 'empty selection') { editor.selection.isEmpty = true; }
        if (scenario === 'untitled document') { editor.document.isUntitled = true; }
        if (scenario === 'virtual document') { editor.document.uri.scheme = 'git'; }
        const state = activate(editor);
        if (scenario === 'no editor') { state.window.activeTextEditor = undefined; }
        await state.execute();
        assert.equal(state.clipboard, 'Existing clipboard');
        assert.equal(state.warnings.length, 1);
        assert.equal(state.errors.length, 0);
    });
}

test('awaits clipboard completion and reports clipboard failures', async () => {
    let rejectWrite;
    const state = activate(createEditor(), () => new Promise((resolve, reject) => { rejectWrite = reject; }));
    let completed = false;
    const result = state.execute().then(() => { completed = true; });
    await Promise.resolve();
    assert.equal(completed, false);
    rejectWrite(new Error('Clipboard unavailable'));
    await result;
    assert.deepEqual(state.errors, ['Could not copy text and location: Clipboard unavailable']);
    assert.equal(state.clipboard, 'Existing clipboard');
});
