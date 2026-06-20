# Mock data

Single file: `src/data/mangaflow.ts`. Conventions:

- IDs are short and prefixed: `s_` staff, `se_` series, `ch_` chapter,
  `t` task, `sm` submission, `b` ballot, `p` publication, `rk_` ranking.
- All staff names are JP romaji + kanji. Keep the editorial tone.
- Cover images come from `src/assets/cover-*.jpg`. Do not introduce stock
  art that breaks the manga look.
- Dates are display strings (`"Jun 19"`). Only switch to ISO when Phase 2
  adds real sorting / calendars.
- Status values are typed enums (`ChapterStatus`, `SeriesStatus`) — never
  inline a magic string.

## Adding a series

1. Add a `Series` entry to `series[]`.
2. Add 1–3 `Chapter` entries pointing at it.
3. Optionally seed a `Task`, `Submission`, and `Publication`.
4. If it should appear in the public Reader, give it `status: "serializing"`
   or `"ended"` and at least one chapter with status `published` or
   `scheduled`.
