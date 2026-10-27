# SIBHC

**S**elective **I**nstant **B**rowser **H**istory **C**leaner

A Firefox / Floorp / Zen (any Firefox-based browser) extension that **instantly deletes history entries** whose **URL** or **page title** contains text you specify.

Most history-cleaning extensions only match against the URL. This one can also match the page title, so a page titled "Google Search" is removed even when its URL doesn't contain "google".

## Features

- **Toolbar popup** with a big power button to pause / resume deletion, and a "Deleted since install" counter.
- **Settings page** (gear button, bottom right of the popup) with two rule boxes:
  - URL matches
  - Page title matches
- **Live rule tester** under each box: type a sample and the border turns green (match) or red (no match), showing which rule matched.
- **Instant deletion**: runs in the background, independent of time or browser restarts. Entries are removed as soon as a visit is recorded, when the title arrives, and when the page finishes loading. Existing history is also scanned when you save rules and on browser startup.
- **Optional regex**: write a rule as `/pattern/` (or `/pattern/i`) to use a regular expression.

## Rule syntax

One rule per line.

| Rule | Meaning |
| --- | --- |
| `google` | Case-insensitive "contains" match |
| `/^https?:\/\/(www\.)?example\.com/` | Regular expression (case-insensitive by default) |
| `# comment` | Ignored |

## Install

### Temporary (for testing)

1. Download or clone this repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `manifest.json`.

Temporary add-ons are removed when the browser closes.

### Permanent

Firefox-based browsers normally require extensions to be signed. You can get a free signature by submitting the extension to [addons.mozilla.org](https://addons.mozilla.org) as **self-distributed (unlisted)**, then installing the signed `.xpi`. Alternatively, use [`web-ext sign`](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign). Check the current AMO documentation for the latest steps.

Note: the add-on ID in `manifest.json` (`sibhc@example.org`) must be unique on AMO. Change it to your own before signing.

## Permissions

| Permission | Why |
| --- | --- |
| `history` | Find and delete history entries |
| `tabs` | Read tab titles/URLs to catch entries as pages load |
| `storage` | Save your rules, on/off state, and the deleted counter locally |

## Privacy

Everything stays on your device. The extension makes no network requests and sends no data anywhere.

## Notes

- Deletion is permanent. Test your rules with the built-in tester before saving.
- Titles often arrive after the page loads, so title-based deletion can happen a moment after the visit is recorded.
- The counter can slightly exceed the number of distinct pages if an entry is re-added by the browser and deleted again.
