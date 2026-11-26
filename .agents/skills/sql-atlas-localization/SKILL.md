---
name: sql-atlas-localization
description: Maintain clear Polish and English copy across SQL Atlas interfaces, diagnostics and reports. Use when adding or editing user-facing text.
---

# Localization workflow

Change both `en` and `pl` entries in `src/i18n/translations.ts`. Preserve SQL syntax and engine operator names. Write Polish with proper diacritics and check inflection in context. Inspect VS Code, CLI, GitHub Action, exported reports and error messages when the same feature appears there. Add a translation-key parity check when modifying the dictionary structure.
