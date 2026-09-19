This is an extension for Visual Studio Code.

It adds these functions to the right-click context menu:

* `Copy text and location`: Copy the exact text, file path, and location in file of the text.
* `Copy location`: Copy the exact file path, and location in file of the text.

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

The copied output must include this exact coordinate note before the path and range:

```text
Lines and columns are 1-based. Columns are StartInclusive:EndExclusive. Columns count UTF-16 code units.
```

## Clipboard format

`Copy location` copies one Markdown code block containing the coordinate note followed by the absolute file path and range:

````text
```
Lines and columns are 1-based. Columns are StartInclusive:EndExclusive. Columns count UTF-16 code units.
C:\Project\Example.cs:12:5-12:10
```
````

`Copy text and location` appends a second code block containing the exact selected text, with no blank line between the blocks:

````text
```
Lines and columns are 1-based. Columns are StartInclusive:EndExclusive. Columns count UTF-16 code units.
C:\Project\Example.cs:12:5-12:10
```
```
Hello
```
````

- Every opening and closing fence is exactly three backticks, with no language label.
- The coordinate note, location, and fence lines end with LF, including the final closing fence.
- The selected text is preserved verbatim, including whitespace, tabs, line endings, and backticks. Its range refers to the current editor contents, including unsaved edits.
- Exactly one LF is added after the selected text before its closing fence, even when the selection already ends with a newline. This added newline and the fences are outside the selection and its reported range.
- Backticks inside the selected text are not escaped, and the surrounding fences are not lengthened.
- Both commands use the primary selection when multiple selections exist.
