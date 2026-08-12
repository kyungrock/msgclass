const BANNED_WORDS_KEY = "gnclass-banned-words";
const DEFAULT_BANNED_WORDS = ["야구", "농구", "수영", "섹스"];

let cachedBannedWords = null;
let bannedWordsLoadPromise = null;

function parseBannedWordsInput(value) {
  return String(value || "")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);
}

function normalizeBannedWords(words) {
  const unique = [];
  const seen = new Set();

  words.forEach((word) => {
    const normalized = String(word || "").trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(normalized);
  });

  return unique;
}

function readLocalBannedWords() {
  try {
    const raw = localStorage.getItem(BANNED_WORDS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? normalizeBannedWords(data) : null;
  } catch {
    return null;
  }
}

function writeLocalBannedWords(words) {
  const unique = normalizeBannedWords(words);
  try {
    localStorage.setItem(BANNED_WORDS_KEY, JSON.stringify(unique));
  } catch {
    /* ignore */
  }
  cachedBannedWords = unique;
  return unique;
}

function loadBannedWords() {
  if (cachedBannedWords) return [...cachedBannedWords];
  const local = readLocalBannedWords();
  if (local && local.length) {
    cachedBannedWords = local;
    return [...local];
  }
  return [...DEFAULT_BANNED_WORDS];
}

function saveBannedWords(words) {
  return writeLocalBannedWords(words);
}

async function refreshBannedWords({ migrateLocal = false } = {}) {
  if (typeof fetchBannedWords !== "function") {
    return loadBannedWords();
  }

  if (!bannedWordsLoadPromise) {
    bannedWordsLoadPromise = (async () => {
      try {
        let words = await fetchBannedWords();
        const local = readLocalBannedWords();

        // 기존 관리자 localStorage 금지어를 서버로 1회 이전
        if (
          migrateLocal &&
          typeof saveBannedWordsApi === "function" &&
          local &&
          local.length &&
          (!words || !words.length)
        ) {
          words = await saveBannedWordsApi(local);
        }

        return writeLocalBannedWords(words && words.length ? words : DEFAULT_BANNED_WORDS);
      } catch {
        return loadBannedWords();
      } finally {
        bannedWordsLoadPromise = null;
      }
    })();
  }

  return bannedWordsLoadPromise;
}

function getBannedWordsText() {
  return loadBannedWords().join(",");
}

function setBannedWordsFromText(value) {
  const words = parseBannedWordsInput(value);
  return saveBannedWords(words);
}

async function persistBannedWords(words) {
  const unique = normalizeBannedWords(words);
  if (typeof saveBannedWordsApi === "function") {
    const saved = await saveBannedWordsApi(unique);
    return writeLocalBannedWords(saved);
  }
  return writeLocalBannedWords(unique);
}

function addBannedWords(value) {
  const incoming = parseBannedWordsInput(value);
  if (!incoming.length) {
    return { ok: false, message: "금지어를 입력해 주세요. 예: 야구,농구,수영" };
  }

  const current = loadBannedWords();
  const merged = saveBannedWords([...current, ...incoming]);

  return {
    ok: true,
    words: merged,
    message: `${incoming.length}개 처리되었습니다. (현재 총 ${merged.length}개)`,
  };
}

async function addBannedWordsAsync(value) {
  const incoming = parseBannedWordsInput(value);
  if (!incoming.length) {
    return { ok: false, message: "금지어를 입력해 주세요. 예: 야구,농구,수영" };
  }

  const current = loadBannedWords();
  const merged = await persistBannedWords([...current, ...incoming]);
  return {
    ok: true,
    words: merged,
    message: `${incoming.length}개 처리되었습니다. (현재 총 ${merged.length}개)`,
  };
}

function removeBannedWord(word) {
  const words = loadBannedWords().filter((item) => item !== word);
  return saveBannedWords(words);
}

async function removeBannedWordAsync(word) {
  const words = loadBannedWords().filter((item) => item !== word);
  return persistBannedWords(words);
}

function findBannedWordInText(text) {
  const source = String(text || "");
  const words = loadBannedWords();

  for (const word of words) {
    if (!word) continue;
    if (source.toLowerCase().includes(String(word).toLowerCase())) {
      return word;
    }
  }
  return null;
}

async function findBannedWordInTextAsync(text) {
  await refreshBannedWords();
  return findBannedWordInText(text);
}
