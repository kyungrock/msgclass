async function loadPopupConfig() {
  try {
    if (typeof fetchPopupConfig === "function") {
      return await fetchPopupConfig();
    }
  } catch {
    /* fallback below */
  }
  return {
    enabled: true,
    title: "임시 작업중 입니다.",
    body: "참고바랍니다.",
    updatedAt: null,
  };
}

async function savePopupConfig(config) {
  if (typeof savePopupConfigApi === "function") {
    return savePopupConfigApi(config);
  }
  throw new Error("팝업 API를 사용할 수 없습니다.");
}
