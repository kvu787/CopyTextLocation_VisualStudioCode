This is an extension for Visual Studio Code.

It adds a function called `Copy text and location` to the right-click context menu that copies the exact text, file path, and location in file of the text.

The file path uses `\` on Windows and `/` on other OSes.

The location in the file uses the format `startLine:startColumn-endLine:endColumn`, appended to the file path with a colon:

```text
C:\Project\Example.cs:12:5-15:9
```

- Line and column numbers are 1-based.
- The start is inclusive and the end is exclusive: the end points immediately after the selected text.
- Columns count UTF-16 code units, matching [Visual Studio Code's position model](https://code.visualstudio.com/api/references/vscode-api#Position). A tab counts as one unit, regardless of its displayed width.
- Both endpoints are always included, even for single-line selections.

For example, `12:5-12:10` selects columns 5 through 9 on line 12.
