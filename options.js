const api = typeof browser !== "undefined" ? browser : chrome;

const urlBox = document.getElementById("urlRules");
const titleBox = document.getElementById("titleRules");
const msg = document.getElementById("msg");

function flash(text) {
  msg.textContent = text;
  setTimeout(() => (msg.textContent = ""), 2500);
}

api.storage.local.get(["urlRules", "titleRules"]).then((s) => {
  urlBox.value = s.urlRules || "";
  titleBox.value = s.titleRules || "";
});

document.getElementById("save").addEventListener("click", async () => {
  await api.storage.local.set({ urlRules: urlBox.value, titleRules: titleBox.value });
  flash("Saved. History scanned.");
});

document.getElementById("sweep").addEventListener("click", () => {
  api.runtime.sendMessage({ type: "sweep" });
  flash("Scan started.");
});

// ---- Test fields (same matching logic as background.js) ----
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

function firstMatch(rulesText, sample) {
  const lines = rulesText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  for (const line of lines) {
    if (toMatcher(line)(sample)) return line;
  }
  return null;
}

function bindTest(rulesBox, testInput, resultEl) {
  function update() {
    const sample = testInput.value;
    testInput.classList.remove("match", "nomatch");
    resultEl.className = "test-result";
    if (!sample) {
      resultEl.textContent = "";
      return;
    }
    const hit = firstMatch(rulesBox.value, sample);
    if (hit !== null) {
      testInput.classList.add("match");
      resultEl.classList.add("match");
      resultEl.textContent = "Match → " + hit;
    } else {
      testInput.classList.add("nomatch");
      resultEl.classList.add("nomatch");
      resultEl.textContent = "No match";
    }
  }
  rulesBox.addEventListener("input", update);
  testInput.addEventListener("input", update);
}

bindTest(urlBox, document.getElementById("urlTest"), document.getElementById("urlTestResult"));
bindTest(titleBox, document.getElementById("titleTest"), document.getElementById("titleTestResult"));
