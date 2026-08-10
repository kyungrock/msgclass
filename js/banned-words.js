const BANNED_WORDS_KEY = "gnclass-banned-words";
const DEFAULT_BANNED_WORDS = ["야구", "농구", "수영", "섹스"];

function parseBannedWordsInput(value) {
  return String(value || "")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);
}

function loadBannedWords() {
  try {
    const raw = localStorage.getItem(BANNED_WORDS_KEY);
    if (!raw) {
      localStorage.setItem(BANNED_WORDS_KEY, JSON.stringify(DEFAULT_BANNED_WORDS));
      return [...DEFAULT_BANNED_WORDS];
    }
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [...DEFAULT_BANNED_WORDS];
  } catch {
    return [...DEFAULT_BANNED_WORDS];
  }
}

function saveBannedWords(words) {
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

  localStorage.setItem(BANNED_WORDS_KEY, JSON.stringify(unique));
  return unique;
}

function getBannedWordsText() {
  return loadBannedWords().join(",");
}

function setBannedWordsFromText(value) {
  const words = parseBannedWordsInput(value);
  return saveBannedWords(words);
}

function addBannedWords(value) {
  const incoming = parseBannedWordsInput(value);
  if (!incoming.length) {
    return { ok: false, message: "금지어를 입력해 주세요. 예: 야구,농구,수영" };
  }

  const current = loadBannedWords();
  const merged = saveBannedWords([...current, ...incoming]);
  const addedCount = incoming.filter((word) =>
    merged.some((item) => item.toLowerCase() === word.toLowerCase())
  ).length;

  return {
    ok: true,
    words: merged,
    addedCount,
    message: `${incoming.length}개 처리되었습니다. (현재 총 ${merged.length}개)`,
  };
}

function removeBannedWord(word) {
  const words = loadBannedWords().filter((item) => item !== word);
  return saveBannedWords(words);
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
