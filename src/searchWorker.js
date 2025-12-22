const SEARCH_LOCALE = "tr";
const DIACRITIC_PATTERN = /[\u0300-\u036f]/g;

let entries = [];

function normalizeForSearch(value) {
  return String(value || "").toLocaleLowerCase(SEARCH_LOCALE);
}

function foldForSearch(value) {
  return normalizeForSearch(value)
    .normalize("NFD")
    .replace(DIACRITIC_PATTERN, "")
    .replace(/ı/g, "i");
}

self.addEventListener("message", event => {
  const data = event.data || {};
  const { type, payload } = data;
  if (type === "seed") {
    if (Array.isArray(payload)) {
      entries = payload.map(item => ({
        index: item.index,
        folded: typeof item.folded === "string" ? item.folded : foldForSearch(item.text || "")
      }));
    } else {
      entries = [];
    }
    return;
  }
  if (type === "query") {
    if (!payload) return;
    const id = payload.id;
    const value = payload.value || "";
    const tokens = foldForSearch(value).split(/\s+/).filter(Boolean);
    let matches;
    if (!tokens.length) {
      matches = entries.map(entry => entry.index);
    } else {
      matches = [];
      for (const entry of entries) {
        let ok = true;
        for (const token of tokens) {
          if (!entry.folded.includes(token)) {
            ok = false;
            break;
          }
        }
        if (ok) matches.push(entry.index);
      }
    }
    self.postMessage({ type: "result", payload: { id, matches } });
  }
});

