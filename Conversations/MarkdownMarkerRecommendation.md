# Markdown Marker Recommendation

## user

`>>>` seems to have a special meaning in markdown. recommend an alternative

## assistant

I’ll check how `>>>` is used in the repository so the alternative fits its purpose.

## assistant

Yes—at the start of a line, `>>>` creates nested blockquotes.

I recommend `@@@` for both opening and closing markers. It has no special meaning in standard Markdown, and your `START` / `END` labels already distinguish them:

```text
@@@LOCATION_START
...
@@@LOCATION_END
@@@TEXT_START
...
@@@TEXT_END
```

## user

recommend an alternative that is "directional" as in there are two directions that can be used to distinguish "start" and "end"

## assistant

`«««` and `»»»` preserve the directional appearance of your current markers without triggering Markdown blockquotes.

## assistant

I recommend **`«««` for start and `»»»` for end**. These are Unicode guillemets and have no special meaning in standard Markdown.

```text
«««LOCATION_START
...
»»»LOCATION_END
«««TEXT_START
...
»»»TEXT_END
```

For an ASCII-only alternative, use `{{{` and `}}}`.
