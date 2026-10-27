const api = typeof browser !== "undefined" ? browser : chrome;

const power = document.getElementById("power");
const status = document.getElementById("status");
const hint = document.getElementById("hint");
const countEl = document.getElementById("count");

function renderCount(n) {
  countEl.textContent = (n || 0).toLocaleString();
}

function render(enabled) {
  power.className = enabled ? "on" : "off";
  status.textContent = enabled ? "Deletion active" : "Deletion paused";
  hint.textContent = enabled ? "Click the button to pause" : "Click the button to resume";
}

api.storage.local.get(["enabled", "deletedCount"]).then((s) => {
  render(s.enabled !== false);
  renderCount(s.deletedCount);
});

// Keep the counter live while the popup is open
api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.deletedCount) renderCount(changes.deletedCount.newValue);
});

power.addEventListener("click", async () => {
  const s = await api.storage.local.get("enabled");
  const next = !(s.enabled !== false);
  await api.storage.local.set({ enabled: next });
  render(next);
});

document.getElementById("settings").addEventListener("click", () => {
  api.runtime.openOptionsPage();
  window.close();
});
