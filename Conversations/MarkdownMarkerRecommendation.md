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
