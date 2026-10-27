const api = typeof browser !== "undefined" ? browser : chrome;

let enabled = true;
let urlMatchers = [];
let titleMatchers = [];
let deletedCount = 0;
const inFlight = new Set();

// A line written as /regex/flags is treated as a regular expression;
// anything else is a case-insensitive "contains" match.
function toMatcher(line) {
  const m = line.match(/^\/(.+)\/([a-z]*)$/i);
  if (m) {
    try {
      let flags = m[2].replace(/[gy]/g, "");
      if (!flags.includes("i")) flags += "i";
      const re = new RegExp(m[1], flags);
      return (s) => re.test(s);
    } catch (e) { /* invalid regex: fall back to plain text */ }
  }
  const needle = line.toLowerCase();
  return (s) => s.toLowerCase().includes(needle);
}

function parseRules(text) {
  return (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map(toMatcher);
}

function applySettings(s) {
  enabled = s.enabled !== false;
  urlMatchers = parseRules(s.urlRules);
  titleMatchers = parseRules(s.titleRules);
}

function shouldDelete(url, title) {
  if (urlMatchers.some((m) => m(url || ""))) return true;
  if (title && titleMatchers.some((m) => m(title))) return true;
  return false;
}

async function removeIfMatch(url, title) {
  if (!enabled || !url) return;
  if (!shouldDelete(url, title)) return;
  if (inFlight.has(url)) return;
  inFlight.add(url);
  try {
    // Only delete and count if the entry actually exists in history,
    // so redundant deletions don't inflate the counter.
    const visits = await api.history.getVisits({ url });
    if (!visits || visits.length === 0) return;
    await api.history.deleteUrl({ url });
    deletedCount++;
    await api.storage.local.set({ deletedCount });
  } catch (e) { /* ignore */
  } finally {
    inFlight.delete(url);
  }
}

// Scan the entire existing history
async function sweep() {
  if (!enabled) return;
  if (!urlMatchers.length && !titleMatchers.length) return;
  try {
    const items = await api.history.search({ text: "", startTime: 0, maxResults: 1000000 });
    for (const item of items) {
      await removeIfMatch(item.url, item.title);
    }
  } catch (e) { /* ignore */ }
}

async function init() {
  const s = await api.storage.local.get(["enabled", "urlRules", "titleRules", "deletedCount"]);
  deletedCount = s.deletedCount || 0;
  applySettings(s);
  sweep();
}

// As soon as a new visit is recorded
api.history.onVisited.addListener((item) => removeIfMatch(item.url, item.title));

// The title usually arrives after the page loads, so listen for title changes too
if (api.history.onTitleChanged) {
  api.history.onTitleChanged.addListener((item) => removeIfMatch(item.url, item.title));
}

// Tab-side URL/title changes and load completion (deletes again if the entry is re-added)
api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url && !changeInfo.title && changeInfo.status !== "complete") return;
  removeIfMatch(tab.url, tab.title);
  if (changeInfo.status === "complete") {
    setTimeout(() => removeIfMatch(tab.url, tab.title), 1500);
  }
});

// Reload settings and rescan history when rules or the on/off switch change
api.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (!("enabled" in changes || "urlRules" in changes || "titleRules" in changes)) return;
  api.storage.local.get(["enabled", "urlRules", "titleRules"]).then((s) => {
    applySettings(s);
    sweep();
  });
});

api.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "sweep") sweep();
});

init();
