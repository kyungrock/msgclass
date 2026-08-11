async function loadPopupConfig() {
  try {
    if (typeof fetchPopupConfig === "function") {
      return await fetchPopupConfig();
    }
  } catch {
    /* fallback below */
  }
  return {
    enabled: false,
    title: "",
    body: "",
    updatedAt: null,
  };
}

async function savePopupConfig(config) {
  if (typeof savePopupConfigApi === "function") {
    return savePopupConfigApi(config);
  }
  throw new Error("팝업 API를 사용할 수 없습니다.");
}

async function deletePopupConfig() {
  if (typeof deletePopupConfigApi === "function") {
    return deletePopupConfigApi();
  }
  throw new Error("팝업 API를 사용할 수 없습니다.");
}
