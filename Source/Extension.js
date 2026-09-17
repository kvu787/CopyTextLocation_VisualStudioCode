const vscode = require('vscode');

async function copySelection(includeText) {
    const description = includeText ? 'text and location' : 'location';
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        void vscode.window.showWarningMessage('Open a file and select text to copy.');
        return;
    }

    const { document, selection } = editor;
    if (document.isUntitled || !['file', 'vscode-remote'].includes(document.uri.scheme)) {
        void vscode.window.showWarningMessage(`Open or save a file on disk before copying its ${description}.`);
        return;
    }

    if (selection.isEmpty) {
        void vscode.window.showWarningMessage('Select text to copy with its location.');
        return;
    }

    // Selection.start/end are ordered even when the selection was made backwards.
    // VS Code already measures character offsets in UTF-16 code units.
    const { start, end } = selection;
    const location = `${document.uri.fsPath}:${start.line + 1}:${start.character + 1}`
        + `-${end.line + 1}:${end.character + 1}`;
    const note = 'Lines and columns are 1-based; columns count UTF-16 code units '
        + '(a tab counts as one unit). Start inclusive, end exclusive.';
    // Keep the selected text last, with no escaping, indentation, or added suffix.
    const clipboardText = `${location}\n${note}`
        + (includeText ? `\n\n${document.getText(selection)}` : '');

    try {
        await vscode.env.clipboard.writeText(clipboardText);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Could not copy ${description}: ${reason}`);
    }
}

function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'copyTextLocation.copyTextAndLocation', () => copySelection(true)
        ),
        vscode.commands.registerCommand(
            'copyTextLocation.copyLocation', () => copySelection(false)
        )
    );
}

module.exports = { activate };
