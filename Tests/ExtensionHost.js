const assert = require('node:assert/strict');
const fileSystem = require('node:fs/promises');
const path = require('node:path');
const vscode = require('vscode');

async function run() {
    const output = process.env.COPY_TEXT_LOCATION_TEST_OUTPUT;
    assert.ok(output, 'Run integration tests with Run.ps1 -Test.');
    const resultPath = path.join(output, 'IntegrationResults.json');
    const command = 'copyTextLocation.copyTextAndLocation';
    const note = 'Lines and columns are 1-based; columns count UTF-16 code units '
        + '(a tab counts as one unit). Start inclusive, end exclusive.';
    let originalClipboard;
    let count = 0;

    async function verify(editor, selection, range, selectedText) {
        editor.selection = selection;
        assert.equal(editor.document.getText(selection), selectedText);
        await vscode.commands.executeCommand(command);
        assert.equal(await vscode.env.clipboard.readText(),
            `${editor.document.uri.fsPath}:${range}\n${note}\n\n${selectedText}`);
        count++;
    }

    try {
        originalClipboard = await vscode.env.clipboard.readText();
        const extension = vscode.extensions.getExtension('kvu787.copytextlocation');
        assert.ok(extension, 'Built extension was discovered.');
        const filePath = path.join(output, 'Selection Example.txt');
        await fileSystem.writeFile(filePath, 'first\r\n\tA😀e\u0301  \r\nlast\r\n', 'utf8');
        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        const editor = await vscode.window.showTextDocument(document);
        assert.equal(document.eol, vscode.EndOfLine.CRLF);
        if (process.platform === 'win32') {
            assert.ok(document.uri.fsPath.includes('\\'));
            assert.ok(!document.uri.fsPath.includes('/'));
        } else {
            assert.ok(document.uri.fsPath.startsWith('/'));
        }

        // The first command invocation must activate the extension automatically.
        await verify(editor, new vscode.Selection(1, 0, 1, 8), '2:1-2:9', '\tA😀e\u0301  ');
        assert.equal(extension.isActive, true);
        await verify(editor, new vscode.Selection(1, 2, 1, 4), '2:3-2:5', '😀');
        await verify(editor, new vscode.Selection(2, 0, 0, 2), '1:3-3:1', 'rst\r\n\tA😀e\u0301  \r\n');
        await verify(editor, new vscode.Selection(2, 0, 3, 0), '3:1-4:1', 'last\r\n');

        const beforeEmpty = await vscode.env.clipboard.readText();
        editor.selection = new vscode.Selection(0, 0, 0, 0);
        await vscode.commands.executeCommand(command);
        assert.equal(await vscode.env.clipboard.readText(), beforeEmpty);
        count++;

        assert.ok(await editor.edit(builder => builder.insert(new vscode.Position(0, 0), 'changed ')));
        assert.equal(document.isDirty, true);
        await verify(editor, new vscode.Selection(0, 0, 0, 7), '1:1-1:8', 'changed');
        // Discard the test edit before closing the isolated host.
        await vscode.commands.executeCommand('workbench.action.files.revert');

        const lineFeedPath = path.join(output, 'LineFeed.txt');
        await fileSystem.writeFile(lineFeedPath, 'one\ntwo\n', 'utf8');
        const lineFeedDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(lineFeedPath));
        const lineFeedEditor = await vscode.window.showTextDocument(lineFeedDocument);
        assert.equal(lineFeedDocument.eol, vscode.EndOfLine.LF);
        await verify(lineFeedEditor, new vscode.Selection(0, 0, 1, 3), '1:1-2:4', 'one\ntwo');

        lineFeedEditor.selections = [new vscode.Selection(0, 0, 0, 3), new vscode.Selection(1, 0, 1, 3)];
        await vscode.commands.executeCommand(command);
        assert.equal(await vscode.env.clipboard.readText(), `${lineFeedDocument.uri.fsPath}:1:1-1:4\n${note}\n\none`);
        count++;

        const untitled = await vscode.workspace.openTextDocument({ content: 'unsaved' });
        const untitledEditor = await vscode.window.showTextDocument(untitled);
        untitledEditor.selection = new vscode.Selection(0, 0, 0, 7);
        const beforeUntitled = await vscode.env.clipboard.readText();
        await vscode.commands.executeCommand(command);
        assert.equal(await vscode.env.clipboard.readText(), beforeUntitled);
        count++;
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');

        await fileSystem.writeFile(resultPath, JSON.stringify({ passed: true, count, version: vscode.version }, null, 2));
        console.log(`Passed ${count} VS Code integration checks.`);
    } catch (error) {
        await fileSystem.writeFile(resultPath, JSON.stringify({ passed: false, count, error: error.stack }, null, 2));
        throw error;
    } finally {
        if (originalClipboard !== undefined) {
            await vscode.env.clipboard.writeText(originalClipboard);
        }
    }
}

module.exports = { run };
