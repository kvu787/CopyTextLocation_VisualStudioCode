# Copy Text and Location

Select text in a file, right-click the selection, and choose **Copy text and location** or **Copy location**. Both commands are also available in the Command Palette.

**Copy text and location** puts two Markdown code blocks on the clipboard. The first contains the coordinate note followed by the absolute file path and range. The second contains the exact selected text:

````text
```
Lines and columns are 1-based. Columns are StartInclusive:EndExclusive. Columns count UTF-16 code units.
C:\Project\Example.cs:12:5-12:10
```
```
Hello
```
````

**Copy location** includes only the first block:

````text
```
Lines and columns are 1-based. Columns are StartInclusive:EndExclusive. Columns count UTF-16 code units.
C:\Project\Example.cs:12:5-12:10
```
````

Each block uses exactly three backticks on its opening and closing lines, without a language label. There is no blank line between the blocks, and the output ends with a newline after the last closing fence.

Both endpoints are always included. Paths use the operating system's native separators. Coordinates use [VS Code's UTF-16 position model](https://code.visualstudio.com/api/references/vscode-api#Position): an emoji outside the basic multilingual plane takes two column units, and a tab takes one.

Selected text is copied directly from the editor, preserving whitespace, tabs, line endings, backticks, and unsaved edits. One LF newline is always added after the selected text, even if the selection already ends with a newline, before the closing fence. The coordinate note, location, and fence lines also use LF line endings. Backticks in the selection are not escaped, and the surrounding fences are not lengthened. Selections made backwards produce the same ordered range as forward selections. With multiple selections, the primary selection is copied. Its range describes the current editor contents, which may differ from the saved file.

Both commands use the primary selection and are shown for nonempty selections in local files and remote files (SSH, WSL, or containers). Remote paths use the extension host's operating system. Untitled and virtual documents are excluded because they do not have a usable file path; invoking either command directly explains the problem without changing the clipboard.

## Install into VS Code

Follow these steps to install the extension for everyday use on Windows, macOS, or Linux. A `.vsix` file is the extension's installable package. If you already have one, skip to step 5.

1. **Install the prerequisites.** You need [Visual Studio Code](https://code.visualstudio.com/) 1.85 or newer and [Node.js](https://nodejs.org/) 22 or newer with npm. Node.js/npm are needed to create the package; the [VS Code packaging tool requires Node.js 22 or newer](https://github.com/microsoft/vscode-vsce#requirements). Restart VS Code after installing Node.js so its terminal can find it.

2. **Get the extension's source files.** Download this [repository](https://github.com/kvu787/CopyTextLocation_VisualStudioCode) using **Code > Download ZIP** and extract it, or use an existing Git clone.

3. **Open the repository folder in VS Code.** Choose **File > Open Folder...** and select the folder containing `package.json`, `README.md`, and `Source`. Then choose **Terminal > New Terminal**. Run the following to confirm Node.js is available:

   ```text
   node --version
   ```

   The result should be `v22.x.x` or newer. Run the next command in this same folder, where `package.json` is located.

4. **Create the installable package.** Run:

   ```text
   npx --yes @vscode/vsce package --no-dependencies
   ```

   This downloads the packaging tool as needed, runs the extension's build automatically, and creates `copytextlocation-0.1.0.vsix` in the repository folder. The version in the filename follows `package.json`. Wait for the command to finish successfully before continuing. Internet access is needed to download the packaging tool; no separate `npm install` or `Run.cmd` step is required.

   On Windows, if PowerShell reports that `npx.ps1` cannot run because scripts are disabled, use this equivalent command:

   ```powershell
   npx.cmd --yes @vscode/vsce package --no-dependencies
   ```

5. **Install the package in your usual VS Code window.** Press **Ctrl+Shift+P** on Windows/Linux or **Cmd+Shift+P** on macOS to open the Command Palette. Run **Extensions: Install from VSIX...**, select the `.vsix` file created in step 4 (or the one you already have), and complete the installation. If VS Code asks you to reload, do so. This is VS Code's [standard VSIX installation process](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#install-from-a-vsix).

6. **Confirm that it is installed.** Open the Extensions view and search for `@installed Copy Text and Location`. The extension should appear and be enabled.

7. **Try it.** Open a file saved on disk, select some text, right-click the selection, and choose **Copy text and location**. Paste into another editor to check that the first triple-backtick block contains the coordinate note and file path with range, and the second contains the selected text. Repeat with **Copy location** to copy only the first block. Both commands require a nonempty selection in a supported file; save a new untitled file before trying them.

To install an updated copy, repeat the packaging and installation steps with the updated source files.

## Try in a development window on Windows

`Run.cmd` opens a separate, isolated development window. It does not install the extension into your usual VS Code profile; use the installation steps above for that.

Install VS Code 1.85 or newer, then double-click **Run.cmd**. It builds a distributable extension folder, runs the unit tests, and opens an isolated Extension Development Host with this extension enabled. Select text in the specification that opens and use either right-click command. No separate Node.js installation or dependency download is needed.

Each launch writes its build output, test output, and VS Code logs under `MyLogOutput/yyyy-MM-dd_HH-mm-ss/`. The isolated profile and extension directory are also kept there. `MyLogOutput/` and `Build/` are ignored by Git. The extension does not log copied text.

```powershell
.\Run.ps1 -BuildOnly
.\Run.ps1 -Test
.\Run.ps1 -VisualStudioCodePath 'D:\Applications\VSCode\Code.exe'
```

`-Test` runs the tests inside the installed VS Code as well as the unit tests. It temporarily uses the system clipboard and restores its previous plain-text contents. Avoid copying other text during this test. Results are saved as `IntegrationResults.json` in the session folder.

## Development

The extension is plain JavaScript with no runtime or development dependencies. With Node.js 20 or newer, run `node Scripts/Build.js` to build and `node --test Tests/Extension.test.js` to run unit tests on any operating system. The build is placed in `Build/CopyTextLocation/`.

To run in a development window on macOS or Linux, launch `code --extensionDevelopmentPath="$PWD/Build/CopyTextLocation"` after building. To install into your usual VS Code profile, follow [Install into VS Code](#install-into-vs-code) above. The package excludes conversations, tests, scripts, and session logs.

The tests cover exact clipboard output, triple-backtick fences, trailing newlines, both endpoints, native paths, whitespace, Unicode, empty selections, unsupported documents, and clipboard failures. The VS Code integration checks exercise actual selections, clipboard writes, activation, unsaved edits, and selected Markdown containing code fences.
