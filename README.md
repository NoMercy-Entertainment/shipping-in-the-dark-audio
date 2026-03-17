# Shipping in the Dark — Audio Narration Pipeline

Multi-voice audio narration for [Shipping in the Dark](https://journal.nomercy.tv) journal entries. Each entry becomes a produced audio log with distinct voices for each AI agent character, mood-appropriate prosody, and carefully verified pronunciation.

## How It Works

1. Journal entries (markdown) are pulled from the [shipping-in-the-dark](https://github.com/NoMercy-Entertainment/shipping-in-the-dark) repo
2. The SSML generator converts markdown into a multi-voice SSML script using the voice cast and pronunciation dictionary
3. Azure Speech API synthesizes the audio
4. Content hashing prevents duplicate generation — only changed entries are re-synthesized
5. Audio files are published as GitHub Release assets

## Structure

```
config/
  voices.json          # Voice cast — which Azure voice each agent uses
  pronunciation.json   # Tech term pronunciation overrides (IPA/SAPI)
  moods.json           # Mood presets for prosody (cozy, tense, spooky, etc.)
  budget.json          # Monthly character budget tracking

scripts/
  generate.mjs         # Main pipeline: markdown → SSML → audio
  ssml-builder.mjs     # Markdown-to-SSML converter with voice switching
  hash.mjs             # Content hashing for deduplication
  budget-check.mjs     # Pre-flight budget check before synthesis

output/
  hashes.json          # Content hashes for each generated entry
  *.mp3                # Generated audio files (gitignored, published as releases)

.github/
  workflows/
    generate.yml       # CI pipeline — manual dispatch or triggered by content changes
```

## Voice Cast

Each agent has a consistent voice across all entries. See `config/voices.json` for the full mapping.

## Pronunciation Dictionary

Tech terms, project names, and agent names that Azure mispronounces are corrected in `config/pronunciation.json`. Uses SSML `<phoneme>` tags with IPA notation.

## Budget Management

Azure Speech free tier provides 500,000 characters/month (shared with Twitch bot TTS). The pipeline checks remaining budget before synthesis and refuses to generate if it would exceed the limit. Budget tracking lives in `config/budget.json`.

## Content Hashing

Each entry's audio fingerprint is a SHA-256 hash of:
- The markdown body content (frontmatter stripped)
- The voice cast config
- The pronunciation dictionary
- The mood config

If the hash matches the previously generated version, synthesis is skipped. This means:
- Editing an entry's text → regenerates audio
- Adding a pronunciation fix → regenerates all entries using that term
- Changing a voice cast → regenerates entries featuring that agent
- Pushing unrelated changes → no characters burned

## License

Audio content is published under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), matching the journal entries.
