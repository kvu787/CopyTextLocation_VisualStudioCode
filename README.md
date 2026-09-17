# Copy Text and Location

Select text in a file, right-click the selection, and choose **Copy text and location**. The same command is available in the Command Palette.

The clipboard contains the absolute file path and range, a note defining the coordinates, a blank line, and the exact selected text:

```text
C:\Project\Example.cs:12:5-12:10
Lines and columns are 1-based; columns count UTF-16 code units (a tab counts as one unit). Start inclusive, end exclusive.

Hello
```

Both endpoints are always included. Paths use the operating system's native separators. Coordinates use [VS Code's UTF-16 position model](https://code.visualstudio.com/api/references/vscode-api#Position): an emoji outside the basic multilingual plane takes two column units, and a tab takes one.

Selected text is copied directly from the editor, preserving whitespace, tabs, line endings, and unsaved edits. Nothing is appended after it. Metadata lines use LF line endings. Selections made backwards produce the same ordered range as forward selections. With multiple selections, the primary selection is copied. Its range describes the current editor contents, which may differ from the saved file.

The command is shown for nonempty selections in local files and remote files (SSH, WSL, or containers). Remote paths use the extension host's operating system. Untitled and virtual documents are excluded because they do not have a usable file path; invoking the command directly explains the problem without changing the clipboard.

## Run on Windows

Install VS Code 1.85 or newer, then double-click **Run.cmd**. It builds a distributable extension folder, runs the unit tests, and opens an isolated Extension Development Host with this extension enabled. Select text in the specification that opens and use the right-click command. No separate Node.js installation or dependency download is needed.

Each launch writes its build output, test output, and VS Code logs under `MyLogOutput/yyyy-MM-dd_HH-mm-ss/`. The isolated profile and extension directory are also kept there. `MyLogOutput/` and `Build/` are ignored by Git. The extension does not log copied text.

```powershell
.\Run.ps1 -BuildOnly
.\Run.ps1 -Test
.\Run.ps1 -VisualStudioCodePath 'D:\Applications\VSCode\Code.exe'
```

`-Test` runs the tests inside the installed VS Code as well as the unit tests. It temporarily uses the system clipboard and restores its previous plain-text contents. Avoid copying other text during this test. Results are saved as `IntegrationResults.json` in the session folder.

## Development and installation

The extension is plain JavaScript with no runtime or development dependencies. With Node.js 20 or newer, run `node Scripts/Build.js` to build and `node --test Tests/Extension.test.js` to run unit tests on any operating system. The build is placed in `Build/CopyTextLocation/`.

To run on macOS or Linux, launch `code --extensionDevelopmentPath="$PWD/Build/CopyTextLocation"` after building. To create an installable package, run `npx @vscode/vsce package --no-dependencies` from the repository root (requires Node.js/npm and downloads the packaging tool), then use **Extensions: Install from VSIX...** in VS Code. The package excludes conversations, tests, scripts, and session logs.

The tests cover exact clipboard output, both endpoints, native paths, whitespace, Unicode, empty selections, unsupported documents, and clipboard failures. The VS Code integration checks exercise actual selections, clipboard writes, activation, and unsaved edits.
