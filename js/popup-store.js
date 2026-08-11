const POPUP_STORAGE_KEY = "gnclass-popup-config";

const DEFAULT_POPUP = {
  enabled: true,
  title: "임시 작업중 입니다.",
  body: "참고바랍니다.",
  updatedAt: "2026-08-11T00:00:00.000Z",
};

function loadPopupConfig() {
  try {
    const raw = localStorage.getItem(POPUP_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify(DEFAULT_POPUP));
      return { ...DEFAULT_POPUP };
    }
    const data = JSON.parse(raw);
    return {
      enabled: data.enabled !== false,
      title: String(data.title || DEFAULT_POPUP.title),
      body: String(data.body || DEFAULT_POPUP.body),
      updatedAt: data.updatedAt || DEFAULT_POPUP.updatedAt,
    };
  } catch {
    return { ...DEFAULT_POPUP };
  }
}

function savePopupConfig(config) {
  const next = {
    enabled: !!config.enabled,
    title: String(config.title || "").trim() || DEFAULT_POPUP.title,
    body: String(config.body || "").trim() || DEFAULT_POPUP.body,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify(next));
  return next;
}
