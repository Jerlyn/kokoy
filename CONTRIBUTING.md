# Contributing to Kokoy Dictionary

Kokoy is a living language, and this dictionary is only as good as what the community adds to it. Corrections and new words from Kokoy speakers, especially from Marigot, Wesley, Woodford Hill, and Clifton, are the most valuable contributions this project can get.

## Suggesting a word (no technical skill needed)

Use the **Suggest a Word** form on the site itself. It opens a pre-filled GitHub Issue in a new tab — you just click submit there. No account is needed to fill out the form, though a free GitHub account is needed to actually post the issue.

## Editing the dictionary directly (for GitHub users)

The dictionary lives in two files:

- `data/dictionary.json` — single words
- `data/phrases.json` — phrases and common expressions

Each dictionary entry follows this shape:

```json
{
  "id": "unique-slug",
  "kokoy": "Kokoy word",
  "english": "English meaning",
  "pronunciation": "phonetic spelling, optional",
  "partOfSpeech": "noun / verb / adjective / etc., optional",
  "category": "e.g. food, family, greetings — optional, powers the filter dropdown",
  "example": { "kokoy": "", "english": "" },
  "notes": "usage notes, regional variation, etc., optional",
  "audio": "path to an audio file, optional, not yet used"
}
```

Each phrase entry follows this shape:

```json
{
  "id": "unique-slug",
  "kokoy": "Full Kokoy phrase",
  "english": "English meaning",
  "pronunciation": "optional",
  "usage": "when/how this phrase is used",
  "notes": "optional"
}
```

To contribute:

1. Fork the repo
2. Add or edit an entry in the relevant JSON file (keep valid JSON — trailing commas will break the site)
3. Open a Pull Request describing the change and, if you're comfortable sharing, which village or generation you're drawing the word from — that context matters for a creole with regional variation

## Reviewing accuracy

Word meanings and spellings are checked against community knowledge before merging, since Kokoy has no single standardized spelling system. When in doubt, a note in the `notes` field flagging regional variation is more honest than picking one "correct" version.

## Code contributions

The site is plain HTML/CSS/JS with no build step, on purpose, so it stays easy for non-developers to read and edit. Keep new code dependency-free where possible.
