document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("popup-write-form");
  if (!form) return;

  let user = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
  if (typeof fetchCurrentUser === "function") {
    try {
      user = await fetchCurrentUser();
    } catch {
      user = null;
    }
  }

  if (!user || user.role !== "admin") {
    alert("관리자만 접근할 수 있습니다.");
    window.location.href = "login.html";
    return;
  }

  const titleInput = document.getElementById("popup-title");
  const bodyInput = document.getElementById("popup-body");
  const enabledInput = document.getElementById("popup-enabled");
  const submitBtn = form.querySelector('button[type="submit"]');

  const pageTitle = document.querySelector(".page-hero h1");
  try {
    const config = await loadPopupConfig();
    titleInput.value = config.title || "";
    bodyInput.value = config.body || "";
    enabledInput.checked = !!config.enabled;
    if (config.title && config.body) {
      if (pageTitle) pageTitle.textContent = "팝업 수정";
      if (submitBtn) submitBtn.textContent = "수정하기";
      document.title = "팝업 수정 | 강남더라임";
    }
  } catch (err) {
    alert(err.message || "팝업 정보를 불러오지 못했습니다.");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    if (!title || !body) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    try {
      await savePopupConfig({
        enabled: enabledInput.checked,
        title,
        body,
      });
      try {
        sessionStorage.removeItem("gnclass-popup-dismissed");
      } catch {
        /* ignore */
      }
      alert("팝업이 저장되었습니다.");
      window.location.href = "popup.html";
    } catch (err) {
      alert(err.message || "저장에 실패했습니다.");
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
